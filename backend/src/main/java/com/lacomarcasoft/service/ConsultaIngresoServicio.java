
package com.lacomarcasoft.service;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ConsultaIngresoServicio {

    private static final int LONGITUD_MAXIMA_DOCUMENTO = 30;

    private static final java.util.regex.Pattern PATRON_DOCUMENTO =
        java.util.regex.Pattern.compile(
            "^[0-9]+(?:-[A-Za-z0-9]{1,2})?$"
        );

    private final JdbcTemplate jdbc;

    public ConsultaIngresoServicio(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record ExamenDisponible(
        Long idExamen,
        String codigo,
        String nombreExamen,
        String materia,
        String estado
    ) {}

    public record EstudianteDisponible(
        Long idEstudiante,
        String codigoUniversitario,
        String nombreEstudiante
    ) {}

    public record EstudianteIdentificado(
        Long idExamen,
        Long idEstudiante,
        String documentoIdentidad,
        String codigoUniversitario,
        String nombreEstudiante,
        boolean asociadoAlExamen
    ) {}

    @Transactional(readOnly = true)
    public List<ExamenDisponible> listarExamenes() {
        return jdbc.query("""
            SELECT
                e.id_examen,
                e.codigo,
                e.nombre_examen,
                e.estado,
                CONCAT(a.nombre_asignatura, ' - Grupo ', m.grupo) AS materia
            FROM academico.examen e
            JOIN academico.materia m
                ON m.id_materia = e.id_materia
            JOIN academico.asignatura a
                ON a.id_asignatura = m.id_asignatura
            ORDER BY e.id_examen DESC
            """,
            (rs, fila) -> new ExamenDisponible(
                rs.getLong("id_examen"),
                rs.getString("codigo"),
                rs.getString("nombre_examen"),
                rs.getString("materia"),
                rs.getString("estado")
            )
        );
    }

    @Transactional(readOnly = true)
    public List<EstudianteDisponible> listarEstudiantes(
            Long idExamen) {

        if (idExamen == null || idExamen <= 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Identificador de examen invalido"
            );
        }

        boolean existe = Boolean.TRUE.equals(
            jdbc.queryForObject("""
                SELECT EXISTS (
                    SELECT 1
                    FROM academico.examen
                    WHERE id_examen = ?
                )
                """,
                Boolean.class,
                idExamen
            )
        );

        if (!existe) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Examen no encontrado"
            );
        }

        return jdbc.query("""
            SELECT
                u.id_usuario,
                u.codigo_sis,
                TRIM(CONCAT(u.nombre, ' ', u.apellido))
                    AS nombre_estudiante
            FROM academico.examen e
            JOIN academico.materia_estudiante me
                ON me.id_materia = e.id_materia
            JOIN seguridad.usuario u
                ON u.id_usuario = me.id_estudiante
            JOIN seguridad.rol r
                ON r.id_rol = u.id_rol
            WHERE e.id_examen = ?
                AND u.activo = TRUE
                AND UPPER(r.nombre_rol) = 'ESTUDIANTE'
            ORDER BY u.nombre, u.apellido
            """,
            (rs, fila) -> new EstudianteDisponible(
                rs.getLong("id_usuario"),
                rs.getString("codigo_sis"),
                rs.getString("nombre_estudiante")
            ),
            idExamen
        );
    }

    @Transactional(readOnly = true)
    public EstudianteIdentificado identificarPorDocumento(
            Long idExamen,
            String documento) {

        if (idExamen == null || idExamen <= 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Identificador de examen invalido"
            );
        }

        String documentoLimpio =
            documento == null ? "" : documento.strip();

        if (documentoLimpio.isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Debe ingresar un documento de identidad"
            );
        }

        if (documentoLimpio.length() > LONGITUD_MAXIMA_DOCUMENTO) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "El documento de identidad no puede superar los "
                    + LONGITUD_MAXIMA_DOCUMENTO
                    + " caracteres"
            );
        }

        if (!PATRON_DOCUMENTO.matcher(documentoLimpio).matches()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Formato de documento invalido. "
                    + "Ingrese numeros o numeros con un "
                    + "complemento alfanumerico valido, "
                    + "por ejemplo 12345678-1A"
            );
        }

        boolean existeExamen = Boolean.TRUE.equals(
            jdbc.queryForObject("""
                SELECT EXISTS (
                    SELECT 1
                    FROM academico.examen
                    WHERE id_examen = ?
                )
                """,
                Boolean.class,
                idExamen
            )
        );

        if (!existeExamen) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Examen no encontrado"
            );
        }

        List<EstudianteIdentificado> resultados = jdbc.query("""
            SELECT
                u.id_usuario,
                u.carnet_identidad,
                u.codigo_sis,
                TRIM(CONCAT(u.nombre, ' ', u.apellido))
                    AS nombre_estudiante,
                EXISTS (
                    SELECT 1
                    FROM academico.examen e
                    JOIN academico.materia_estudiante me
                        ON me.id_materia = e.id_materia
                    WHERE e.id_examen = ?
                    AND me.id_estudiante = u.id_usuario
                ) AS asociado_examen
            FROM seguridad.usuario u
            JOIN seguridad.rol r
                ON r.id_rol = u.id_rol
            WHERE u.carnet_identidad = ?
            AND u.activo = TRUE
            AND UPPER(r.nombre_rol) = 'ESTUDIANTE'
            """,
            (rs, fila) -> new EstudianteIdentificado(
                idExamen,
                rs.getLong("id_usuario"),
                rs.getString("carnet_identidad"),
                rs.getString("codigo_sis"),
                rs.getString("nombre_estudiante"),
                rs.getBoolean("asociado_examen")
            ),
            idExamen,
            documentoLimpio
        );

        if (resultados.isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "No se encontro un estudiante con ese documento"
            );
        }

        return resultados.get(0);
    }

    private static final int LONGITUD_MAXIMA_CODIGO = 30;

    private static final java.util.regex.Pattern PATRON_CODIGO =
        java.util.regex.Pattern.compile(
            "^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$"
        );

    @Transactional(readOnly = true)
    public EstudianteIdentificado identificarPorCodigo(
            Long idExamen,
            String codigo) {

        if (idExamen == null || idExamen <= 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Identificador de examen invalido"
            );
        }

        String limpio = codigo == null ? "" : codigo.strip();

        if (limpio.isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Debe ingresar un codigo universitario"
            );
        }

        if (limpio.length() > LONGITUD_MAXIMA_CODIGO) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "El codigo universitario no puede superar 30 caracteres"
            );
        }

        if (!PATRON_CODIGO.matcher(limpio).matches()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Formato de codigo universitario invalido"
            );
        }

        boolean existe = Boolean.TRUE.equals(
            jdbc.queryForObject("""
                SELECT EXISTS (
                    SELECT 1
                    FROM academico.examen
                    WHERE id_examen = ?
                )
                """,
                Boolean.class,
                idExamen
            )
        );

        if (!existe) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Examen no encontrado"
            );
        }

        List<EstudianteIdentificado> encontrados = jdbc.query("""
            SELECT
                u.id_usuario,
                u.carnet_identidad,
                u.codigo_sis,
                TRIM(CONCAT(u.nombre, ' ', u.apellido))
                    AS nombre_estudiante,
                EXISTS (
                    SELECT 1
                    FROM academico.examen e
                    JOIN academico.materia_estudiante me
                        ON me.id_materia = e.id_materia
                    WHERE e.id_examen = ?
                        AND me.id_estudiante = u.id_usuario
                ) AS asociado_examen
            FROM seguridad.usuario u
            JOIN seguridad.rol r
                ON r.id_rol = u.id_rol
            WHERE u.codigo_sis = ?
                AND u.activo = TRUE
                AND UPPER(r.nombre_rol) = 'ESTUDIANTE'
            """,
            (rs, fila) -> new EstudianteIdentificado(
                idExamen,
                rs.getLong("id_usuario"),
                rs.getString("carnet_identidad"),
                rs.getString("codigo_sis"),
                rs.getString("nombre_estudiante"),
                rs.getBoolean("asociado_examen")
            ),
            idExamen,
            limpio
        );

        if (encontrados.isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "No se encontro un estudiante con ese codigo universitario"
            );
        }

        if (encontrados.size() > 1) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Existen registros duplicados para el codigo universitario"
            );
        }

        return encontrados.get(0);
    }
}
