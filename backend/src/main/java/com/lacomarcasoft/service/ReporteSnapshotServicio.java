package com.lacomarcasoft.service;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ReporteSnapshotServicio {

    private final JdbcTemplate jdbc;
    private final JsonMapper objectMapper;

    public ReporteSnapshotServicio(
            JdbcTemplate jdbc,
            JsonMapper objectMapper) {

        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
    }

    public <T> void guardar(Long idReporte, T contenido) {

        if (idReporte == null || idReporte <= 0) {
            throw new IllegalArgumentException(
                    "Identificador de reporte inválido");
        }

        if (contenido == null) {
            throw new IllegalArgumentException(
                    "El contenido del reporte no puede ser nulo");
        }

        try {
            String json = objectMapper.writeValueAsString(contenido);

            jdbc.update("""
                    INSERT INTO seguridad.reporte_snapshot
                        (id_reporte, contenido)
                    VALUES (?, CAST(? AS JSONB))
                    """,
                    idReporte,
                    json);

        } catch (JacksonException e) {
            throw new IllegalStateException(
                    "No se pudo serializar el reporte " + idReporte,
                    e);
        }
    }

    public <T> Optional<T> recuperar(
            Long idReporte,
            Class<T> tipo) {

        if (idReporte == null || idReporte <= 0) {
            throw new IllegalArgumentException(
                    "Identificador de reporte inválido");
        }

        List<String> resultados = jdbc.query("""
                SELECT contenido::TEXT
                FROM seguridad.reporte_snapshot
                WHERE id_reporte = ?
                """,
                (rs, fila) -> rs.getString(1),
                idReporte);

        if (resultados.isEmpty()) {
            return Optional.empty();
        }

        try {
            T reporte = objectMapper.readValue(
                    resultados.get(0),
                    tipo);

            return Optional.of(reporte);

        } catch (JacksonException e) {
            throw new IllegalStateException(
                    "No se pudo recuperar el reporte " + idReporte,
                    e);
        }
    }
}
