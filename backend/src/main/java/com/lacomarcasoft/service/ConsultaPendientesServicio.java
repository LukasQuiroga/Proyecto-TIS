
package com.lacomarcasoft.service;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;

@Service
public class ConsultaPendientesServicio {

    private final JdbcTemplate jdbc;

    public ConsultaPendientesServicio(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record EstudiantePendiente(
            Long idEstudiante,
            String codigoUniversitario,
            String nombreCompleto,
            Long idExamen,
            String nombreExamen,
            LocalDate fechaExamen,
            String carrera,
            String estado
    ) {}

    private static final String CONSULTA_BASE = """
            SELECT DISTINCT
                   u.id_usuario AS id_estudiante,
                   u.codigo_sis AS codigo_universitario,
                   CONCAT_WS(' ', u.nombre, u.apellido) AS nombre_completo,
                   e.id_examen,
                   e.nombre_examen,
                   e.fecha_examen,
                   (
                       SELECT STRING_AGG(
                           c.nombre, ', ' ORDER BY c.nombre
                       )
                       FROM academico.usuario_carrera uc
                       JOIN academico.carrera c
                         ON c.id_carrera = uc.id_carrera
                       WHERE uc.id_usuario = u.id_usuario
                   ) AS carrera
            FROM academico.examen e
            JOIN academico.materia_estudiante me
              ON me.id_materia = e.id_materia
            JOIN seguridad.usuario u
              ON u.id_usuario = me.id_estudiante
            JOIN seguridad.rol r
              ON r.id_rol = u.id_rol
            WHERE u.activo = TRUE
              AND UPPER(r.nombre_rol) = 'ESTUDIANTE'
              AND NOT EXISTS (
                  SELECT 1
                  FROM academico.ingreso_examen ie
                  WHERE ie.id_examen = e.id_examen
                    AND ie.id_estudiante = u.id_usuario
              )
            """;

    public List<EstudiantePendiente> listar(Long idExamen) {
        validarExamen(idExamen);

        String sql = CONSULTA_BASE
                + (idExamen == null
                    ? ""
                    : " AND e.id_examen = ?")
                + """
                  ORDER BY e.fecha_examen NULLS LAST,
                           e.id_examen,
                           nombre_completo,
                           id_estudiante
                  """;

        if (idExamen == null) {
            return jdbc.query(sql, this::mapear);
        }

        return jdbc.query(sql, this::mapear, idExamen);
    }

    public EstudiantePendiente detalle(
            Long idExamen,
            Long idEstudiante
    ) {
        if (idExamen == null || idExamen <= 0
                || idEstudiante == null || idEstudiante <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Identificador invalido"
            );
        }

        validarExamen(idExamen);

        List<EstudiantePendiente> resultados = jdbc.query(
                CONSULTA_BASE
                        + " AND e.id_examen = ? AND u.id_usuario = ?",
                this::mapear,
                idExamen,
                idEstudiante
        );

        if (resultados.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Estudiante pendiente no encontrado"
            );
        }

        return resultados.get(0);
    }

    private void validarExamen(Long idExamen) {
        if (idExamen == null) {
            return;
        }

        if (idExamen <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Identificador de examen invalido"
            );
        }

        Boolean existe = jdbc.queryForObject(
                """
                SELECT EXISTS (
                    SELECT 1
                    FROM academico.examen
                    WHERE id_examen = ?
                )
                """,
                Boolean.class,
                idExamen
        );

        if (!Boolean.TRUE.equals(existe)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Examen no encontrado"
            );
        }
    }

    private EstudiantePendiente mapear(
            ResultSet rs,
            int fila
    ) throws SQLException {
        java.sql.Date fecha = rs.getDate("fecha_examen");

        return new EstudiantePendiente(
                rs.getLong("id_estudiante"),
                rs.getString("codigo_universitario"),
                rs.getString("nombre_completo"),
                rs.getLong("id_examen"),
                rs.getString("nombre_examen"),
                fecha == null ? null : fecha.toLocalDate(),
                rs.getString("carrera"),
                "PENDIENTE"
        );
    }
}
