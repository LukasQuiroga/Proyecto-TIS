package com.lacomarcasoft.repository;

import com.lacomarcasoft.dto.response.LogActividadRespuesta;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

@Repository
public class LogActividadRepositorio {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public LogActividadRepositorio(
            NamedParameterJdbcTemplate jdbcTemplate
    ) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Long insertar(
            Long idUsuario,
            String tipoAccion,
            String descripcion,
            String ipOrigen,
            OffsetDateTime fecha,
            boolean exitosa
    ) {

        String sql = """
                INSERT INTO log_actividad (
                    id_usuario,
                    tipo_accion,
                    descripcion,
                    ip_origen,
                    fecha,
                    exitosa
                )
                VALUES (
                    :idUsuario,
                    :tipoAccion,
                    :descripcion,
                    :ipOrigen,
                    :fecha,
                    :exitosa
                )
                """;

        MapSqlParameterSource parametros =
                new MapSqlParameterSource();

        parametros.addValue("idUsuario", idUsuario);
        parametros.addValue("tipoAccion", tipoAccion);
        parametros.addValue("descripcion", descripcion);
        parametros.addValue("ipOrigen", ipOrigen);
        parametros.addValue("fecha", fecha);
        parametros.addValue("exitosa", exitosa);

        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(
                sql,
                parametros,
                keyHolder,
                new String[]{"id_log"}
        );

        return keyHolder.getKey().longValue();
    }

    public List<LogActividadRespuesta> consultar(
            String busqueda,
            String tipoAccion,
            LocalDate fechaDesde,
            LocalDate fechaHasta,
            Long idUsuario,
            Boolean exitosa,
            int pagina,
            int tamanio
    ) {

        MapSqlParameterSource parametros =
                new MapSqlParameterSource();

        String condiciones = construirCondiciones(
                busqueda,
                tipoAccion,
                fechaDesde,
                fechaHasta,
                idUsuario,
                exitosa,
                parametros
        );

        parametros.addValue("limite", tamanio);
        parametros.addValue("offset", pagina * tamanio);

        String sql = """
                SELECT
                    l.id_log,
                    l.id_usuario,
                    u.nombre,
                    u.apellido,
                    l.tipo_accion,
                    l.descripcion,
                    l.ip_origen,
                    l.fecha,
                    l.exitosa
                FROM log_actividad l
                LEFT JOIN usuario u
                    ON u.id_usuario = l.id_usuario
                """ + condiciones + """
                ORDER BY
                    l.fecha DESC,
                    l.id_log DESC
                LIMIT :limite
                OFFSET :offset
                """;

        return jdbcTemplate.query(
                sql,
                parametros,
                this::mapearLog
        );
    }

    public long contar(
            String busqueda,
            String tipoAccion,
            LocalDate fechaDesde,
            LocalDate fechaHasta,
            Long idUsuario,
            Boolean exitosa
    ) {

        MapSqlParameterSource parametros =
                new MapSqlParameterSource();

        String condiciones = construirCondiciones(
                busqueda,
                tipoAccion,
                fechaDesde,
                fechaHasta,
                idUsuario,
                exitosa,
                parametros
        );

        String sql = """
                SELECT COUNT(*)
                FROM log_actividad l
                LEFT JOIN usuario u
                    ON u.id_usuario = l.id_usuario
                """ + condiciones;

        Long total = jdbcTemplate.queryForObject(
                sql,
                parametros,
                Long.class
        );

        return total == null
                ? 0
                : total;
    }

    public Optional<LogActividadRespuesta> buscarPorId(
            Long idLog
    ) {

        String sql = """
                SELECT
                    l.id_log,
                    l.id_usuario,
                    u.nombre,
                    u.apellido,
                    l.tipo_accion,
                    l.descripcion,
                    l.ip_origen,
                    l.fecha,
                    l.exitosa
                FROM log_actividad l
                LEFT JOIN usuario u
                    ON u.id_usuario = l.id_usuario
                WHERE l.id_log = :idLog
                """;

        List<LogActividadRespuesta> resultados =
                jdbcTemplate.query(
                        sql,
                        new MapSqlParameterSource(
                                "idLog",
                                idLog
                        ),
                        this::mapearLog
                );

        return resultados
                .stream()
                .findFirst();
    }

    public List<String> listarTipos() {

        String sql = """
                SELECT DISTINCT l.tipo_accion
                FROM log_actividad l
                ORDER BY l.tipo_accion ASC
                """;

        return jdbcTemplate.queryForList(
                sql,
                new MapSqlParameterSource(),
                String.class
        );
    }

    private String construirCondiciones(
            String busqueda,
            String tipoAccion,
            LocalDate fechaDesde,
            LocalDate fechaHasta,
            Long idUsuario,
            Boolean exitosa,
            MapSqlParameterSource parametros
    ) {

        StringBuilder condiciones =
                new StringBuilder();

        if (
                busqueda != null
                && !busqueda.isBlank()
        ) {

            condiciones.append("""
                    AND (
                        LOWER(l.tipo_accion) LIKE :busqueda
                        OR LOWER(l.descripcion) LIKE :busqueda
                        OR LOWER(COALESCE(u.nombre, ''))
                            LIKE :busqueda
                        OR LOWER(COALESCE(u.apellido, ''))
                            LIKE :busqueda
                        OR LOWER(
                            CONCAT_WS(' ', u.nombre, u.apellido)
                        ) LIKE :busqueda
                    )
                    """);

            parametros.addValue(
                    "busqueda",
                    "%" +
                    busqueda
                            .trim()
                            .toLowerCase()
                    + "%"
            );
        }

        if (
                tipoAccion != null
                && !tipoAccion.isBlank()
        ) {

            condiciones.append(
                    " AND LOWER(l.tipo_accion) = LOWER(:tipoAccion)\n"
            );

            parametros.addValue(
                    "tipoAccion",
                    tipoAccion.trim()
            );
        }

        if (fechaDesde != null) {

            condiciones.append(
                    " AND l.fecha >= :fechaDesde\n"
            );

            parametros.addValue(
                    "fechaDesde",
                    fechaDesde
                            .atStartOfDay(ZoneOffset.UTC)
                            .toOffsetDateTime()
            );
        }

        if (fechaHasta != null) {

            condiciones.append(
                    " AND l.fecha < :fechaHasta\n"
            );

            parametros.addValue(
                    "fechaHasta",
                    fechaHasta
                            .plusDays(1)
                            .atStartOfDay(ZoneOffset.UTC)
                            .toOffsetDateTime()
            );
        }

        if (idUsuario != null) {

            condiciones.append(
                    " AND l.id_usuario = :idUsuario\n"
            );

            parametros.addValue(
                    "idUsuario",
                    idUsuario
            );
        }

        if (exitosa != null) {

            condiciones.append(
                    " AND l.exitosa = :exitosa\n"
            );

            parametros.addValue(
                    "exitosa",
                    exitosa
            );
        }

        return condiciones.toString();
    }

    private LogActividadRespuesta mapearLog(
            ResultSet rs,
            int fila
    ) throws SQLException {

        String nombre = rs.getString("nombre");
        String apellido = rs.getString("apellido");

        String nombreUsuario = null;

        if (
                nombre != null
                && apellido != null
        ) {
            nombreUsuario = nombre + " " + apellido;
        } else if (nombre != null) {
            nombreUsuario = nombre;
        }

        return new LogActividadRespuesta(
                rs.getLong("id_log"),
                rs.getObject("id_usuario", Long.class),
                nombreUsuario,
                rs.getString("tipo_accion"),
                rs.getString("descripcion"),
                rs.getString("ip_origen"),
                rs.getObject("fecha", OffsetDateTime.class),
                rs.getBoolean("exitosa")
        );
    }
}