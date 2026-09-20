package com.lacomarcasoft.repository;

import com.lacomarcasoft.dto.response.EstudianteRespuesta;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class EstudianteRepositorio {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public EstudianteRepositorio(
            NamedParameterJdbcTemplate jdbcTemplate
    ) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<EstudianteRespuesta> consultar(
            String busqueda,
            Boolean activo,
            String carrera,
            int pagina,
            int tamanio
    ) {

        MapSqlParameterSource parametros =
                new MapSqlParameterSource();

        String condiciones = construirCondiciones(
                busqueda,
                activo,
                carrera,
                parametros
        );

        parametros.addValue(
                "limite",
                tamanio
        );

        parametros.addValue(
                "offset",
                pagina * tamanio
        );

        String sql = """
                SELECT
                    u.id_usuario,
                    u.codigo_sis,
                    u.carnet_identidad,
                    u.nombre,
                    u.apellido,
                    u.carrera,
                    u.activo,
                    u.correo,
                    u.celular,
                    u.fecha_creacion
                FROM usuario u
                INNER JOIN rol r
                    ON r.id_rol = u.id_rol
                WHERE r.nombre_rol = 'ESTUDIANTE'
                """ + condiciones + """
                ORDER BY
                    u.apellido ASC,
                    u.nombre ASC,
                    u.id_usuario ASC
                LIMIT :limite
                OFFSET :offset
                """;

        return jdbcTemplate.query(
                sql,
                parametros,
                this::mapearEstudiante
        );
    }

    public long contar(
            String busqueda,
            Boolean activo,
            String carrera
    ) {

        MapSqlParameterSource parametros =
                new MapSqlParameterSource();

        String condiciones = construirCondiciones(
                busqueda,
                activo,
                carrera,
                parametros
        );

        String sql = """
                SELECT COUNT(*)
                FROM usuario u
                INNER JOIN rol r
                    ON r.id_rol = u.id_rol
                WHERE r.nombre_rol = 'ESTUDIANTE'
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

    public Optional<EstudianteRespuesta> buscarPorId(
            Long idUsuario
    ) {

        String sql = """
                SELECT
                    u.id_usuario,
                    u.codigo_sis,
                    u.carnet_identidad,
                    u.nombre,
                    u.apellido,
                    u.carrera,
                    u.activo,
                    u.correo,
                    u.celular,
                    u.fecha_creacion
                FROM usuario u
                INNER JOIN rol r
                    ON r.id_rol = u.id_rol
                WHERE r.nombre_rol = 'ESTUDIANTE'
                  AND u.id_usuario = :idUsuario
                """;

        List<EstudianteRespuesta> resultados =
                jdbcTemplate.query(
                        sql,
                        new MapSqlParameterSource(
                                "idUsuario",
                                idUsuario
                        ),
                        this::mapearEstudiante
                );

        return resultados
                .stream()
                .findFirst();
    }

    public List<String> listarCarreras() {

        String sql = """
                SELECT DISTINCT u.carrera
                FROM usuario u
                INNER JOIN rol r
                    ON r.id_rol = u.id_rol
                WHERE r.nombre_rol = 'ESTUDIANTE'
                  AND u.carrera IS NOT NULL
                  AND TRIM(u.carrera) <> ''
                ORDER BY u.carrera ASC
                """;

        return jdbcTemplate.queryForList(
                sql,
                new MapSqlParameterSource(),
                String.class
        );
    }

    private String construirCondiciones(
            String busqueda,
            Boolean activo,
            String carrera,
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
                        LOWER(COALESCE(u.codigo_sis, ''))
                            LIKE :busqueda
                        OR LOWER(COALESCE(u.carnet_identidad, ''))
                            LIKE :busqueda
                        OR LOWER(COALESCE(u.nombre, ''))
                            LIKE :busqueda
                        OR LOWER(COALESCE(u.apellido, ''))
                            LIKE :busqueda
                        OR LOWER(
                            CONCAT_WS(
                                ' ',
                                u.nombre,
                                u.apellido
                            )
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

        if (activo != null) {

            condiciones.append(
                    " AND u.activo = :activo\n"
            );

            parametros.addValue(
                    "activo",
                    activo
            );
        }

        if (
                carrera != null
                && !carrera.isBlank()
        ) {

            condiciones.append(
                    " AND LOWER(u.carrera) = LOWER(:carrera)\n"
            );

            parametros.addValue(
                    "carrera",
                    carrera.trim()
            );
        }

        return condiciones.toString();
    }

    private EstudianteRespuesta mapearEstudiante(
            ResultSet rs,
            int fila
    ) throws SQLException {

        return new EstudianteRespuesta(
                rs.getLong("id_usuario"),
                rs.getString("codigo_sis"),
                rs.getString("carnet_identidad"),
                rs.getString("nombre"),
                rs.getString("apellido"),
                rs.getString("carrera"),
                rs.getBoolean("activo"),
                rs.getString("correo"),
                rs.getString("celular"),
                rs.getObject(
                        "fecha_creacion",
                        OffsetDateTime.class
                )
        );
    }
}