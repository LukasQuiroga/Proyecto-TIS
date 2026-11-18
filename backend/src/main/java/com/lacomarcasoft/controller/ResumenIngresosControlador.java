
package com.lacomarcasoft.controller;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/ingresos/examenes/registrados/resumen")
public class ResumenIngresosControlador {

    private final JdbcTemplate jdbc;

    public ResumenIngresosControlador(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record ResumenIngresosRespuesta(
            long ingresados,
            long pendientes,
            long rechazados
    ) {}

    @GetMapping
    public ResumenIngresosRespuesta obtenerResumen(
            @RequestParam(required = false) Long idExamen,
            Authentication autenticacion
    ) {

        validarAcceso(autenticacion);

        if (idExamen != null && idExamen <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Identificador de examen invalido"
            );
        }

        if (idExamen != null) {
            validarExistenciaExamen(idExamen);
        }

        long ingresados = contarIngresados(idExamen);
        long pendientes = contarPendientes(idExamen);
        long rechazados = contarRechazados(idExamen);

        return new ResumenIngresosRespuesta(
                ingresados,
                pendientes,
                rechazados
        );
    }

    private void validarAcceso(Authentication autenticacion) {

        if (autenticacion == null
                || !autenticacion.isAuthenticated()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Debe iniciar sesion"
            );
        }

        boolean esAdministrador = autenticacion.getAuthorities()
                .stream()
                .anyMatch(a ->
                        "ROLE_ADMINISTRADOR".equals(a.getAuthority())
                );

        boolean tienePermiso = autenticacion.getAuthorities()
                .stream()
                .anyMatch(a ->
                        "GENERAR_REPORTES".equals(a.getAuthority())
                );

        if (!esAdministrador || !tienePermiso) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "No tiene permisos para consultar indicadores"
            );
        }
    }

    private void validarExistenciaExamen(Long idExamen) {

        Boolean existe = jdbc.queryForObject("""
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

    private long contarIngresados(Long idExamen) {

        String sql = """
                SELECT COUNT(*)
                FROM academico.ingreso_examen ie
                """;

        Long total;

        if (idExamen == null) {
            total = jdbc.queryForObject(
                    sql,
                    Long.class
            );
        } else {
            total = jdbc.queryForObject(
                    sql + " WHERE ie.id_examen = ?",
                    Long.class,
                    idExamen
            );
        }

        return total == null ? 0L : total;
    }

    private long contarPendientes(Long idExamen) {

        String sql = """
                SELECT COUNT(
                    DISTINCT (e.id_examen, me.id_estudiante)
                )
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
                        AND ie.id_estudiante = me.id_estudiante
                  )
                """;

        Long total;

        if (idExamen == null) {
            total = jdbc.queryForObject(
                    sql,
                    Long.class
            );
        } else {
            total = jdbc.queryForObject(
                    sql + " AND e.id_examen = ?",
                    Long.class,
                    idExamen
            );
        }

        return total == null ? 0L : total;
    }

    private long contarRechazados(Long idExamen) {

        String sql = """
                SELECT COUNT(*)
                FROM academico.intento_ingreso_no_autorizado i
                """;

        Long total;

        if (idExamen == null) {
            total = jdbc.queryForObject(
                    sql,
                    Long.class
            );
        } else {
            total = jdbc.queryForObject(
                    sql + " WHERE i.id_examen = ?",
                    Long.class,
                    idExamen
            );
        }

        return total == null ? 0L : total;
    }
}