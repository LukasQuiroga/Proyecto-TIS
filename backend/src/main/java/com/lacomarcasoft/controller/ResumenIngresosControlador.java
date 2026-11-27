package com.lacomarcasoft.controller;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Date;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

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
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String fecha,
            Authentication autenticacion
    ) {
        validarAcceso(autenticacion);

        Filtros filtros = validarFiltros(idExamen, q, fecha);

        return new ResumenIngresosRespuesta(
                contarIngresados(filtros.examen(), filtros.busqueda(), filtros.fecha()),
                contarPendientes(filtros.examen(), filtros.busqueda(), filtros.fecha()),
                contarRechazados(filtros.examen(), filtros.busqueda(), filtros.fecha())
        );
    }


    public record RegistroEstadoRespuesta(
            String tipo,
            Long idRegistro,
            String codigoUniversitario,
            String nombreEstudiante,
            String nombreExamen,
            String ambiente,
            String fecha,
            String hora,
            String estado,
            String detalle
    ) {}

    @GetMapping("/listado")
    public List<RegistroEstadoRespuesta> listarPorTipo(
            @RequestParam String tipo,
            @RequestParam(required = false) Long idExamen,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String fecha,
            Authentication autenticacion
    ) {
        validarAcceso(autenticacion);
        if (!"PENDIENTES".equals(tipo) && !"RECHAZADOS".equals(tipo)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de consulta invalido");
        }
        Filtros filtros = validarFiltros(idExamen, q, fecha);
        return "PENDIENTES".equals(tipo)
                ? listarPendientes(filtros)
                : listarRechazados(filtros);
    }

    private record Filtros(Long examen, String busqueda, LocalDate fecha) {}

    private Filtros validarFiltros(Long idExamen, String q, String fecha) {
        if (idExamen != null && idExamen <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Identificador de examen invalido");
        }
        if (idExamen != null) {
            validarExistenciaExamen(idExamen);
        }
        String busqueda = q == null ? "" : q.strip();
        if (busqueda.length() > 100 || !busqueda.matches("[\\p{L}\\p{N} -]*")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Busqueda de estudiante invalida");
        }
        LocalDate fechaFiltrada = null;
        if (fecha != null && !fecha.isBlank()) {
            try {
                fechaFiltrada = LocalDate.parse(fecha.strip());
            } catch (DateTimeParseException ex) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Fecha invalida. Use AAAA-MM-DD");
            }
            if (fechaFiltrada.isBefore(LocalDate.of(2025, 1, 1))
                    || fechaFiltrada.isAfter(LocalDate.of(2028, 12, 31))) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Fecha fuera del rango permitido");
            }
        }
        return new Filtros(idExamen, busqueda, fechaFiltrada);
    }

    private List<RegistroEstadoRespuesta> listarPendientes(Filtros filtros) {
        StringBuilder sql = new StringBuilder("""
                SELECT DISTINCT e.id_examen, u.id_usuario, u.codigo_sis,
                       TRIM(CONCAT(COALESCE(u.nombre, ''), ' ',
                                   COALESCE(u.apellido, ''))) AS estudiante,
                       e.nombre_examen, COALESCE(e.aula, '') AS ambiente,
                       e.fecha_examen
                FROM academico.examen e
                JOIN academico.materia_estudiante me ON me.id_materia = e.id_materia
                JOIN seguridad.usuario u ON u.id_usuario = me.id_estudiante
                JOIN seguridad.rol r ON r.id_rol = u.id_rol
                WHERE u.activo = TRUE AND UPPER(r.nombre_rol) = 'ESTUDIANTE'
                  AND NOT EXISTS (
                    SELECT 1 FROM academico.ingreso_examen ie
                    WHERE ie.id_examen = e.id_examen
                      AND ie.id_estudiante = me.id_estudiante
                  )
                """);
        List<Object> parametros = new ArrayList<>();
        agregarFiltroExamen(sql, parametros, "e.id_examen", filtros.examen());
        agregarFiltroEstudiante(sql, parametros, filtros.busqueda(), "u");
        if (filtros.fecha() != null) {
            sql.append(" AND e.fecha_examen = ?");
            parametros.add(Date.valueOf(filtros.fecha()));
        }
        sql.append(" ORDER BY e.fecha_examen DESC NULLS LAST, e.id_examen DESC, estudiante");
        return jdbc.query(sql.toString(), (rs, n) -> {
            Date fecha = rs.getDate("fecha_examen");
            return new RegistroEstadoRespuesta(
                    "PENDIENTE", rs.getLong("id_usuario"),
                    rs.getString("codigo_sis"), rs.getString("estudiante"),
                    rs.getString("nombre_examen"), rs.getString("ambiente"),
                    fecha == null ? null : fecha.toLocalDate().toString(),
                    null, "PENDIENTE", "Examen #" + rs.getLong("id_examen"));
        }, parametros.toArray());
    }

    private List<RegistroEstadoRespuesta> listarRechazados(Filtros filtros) {
        StringBuilder sql = new StringBuilder("""
                SELECT i.id_intento, i.identificador_intentado, u.codigo_sis,
                       TRIM(CONCAT(COALESCE(u.nombre, ''), ' ',
                                   COALESCE(u.apellido, ''))) AS estudiante,
                       e.nombre_examen, COALESCE(e.aula, '') AS ambiente,
                       i.fecha_hora, i.motivo_rechazo
                FROM academico.intento_ingreso_no_autorizado i
                JOIN academico.examen e ON e.id_examen = i.id_examen
                LEFT JOIN seguridad.usuario u ON u.id_usuario = i.id_estudiante
                WHERE 1=1
                """);
        List<Object> parametros = new ArrayList<>();
        agregarFiltroExamen(sql, parametros, "i.id_examen", filtros.examen());
        if (!filtros.busqueda().isBlank()) {
            String termino = "%" + filtros.busqueda().toLowerCase() + "%";
            sql.append("""
                     AND (LOWER(COALESCE(i.identificador_intentado, '')) LIKE ?
                      OR LOWER(COALESCE(u.codigo_sis, '')) LIKE ?
                      OR LOWER(TRIM(CONCAT(COALESCE(u.nombre, ''), ' ',
                                          COALESCE(u.apellido, '')))) LIKE ?)
                    """);
            parametros.add(termino);
            parametros.add(termino);
            parametros.add(termino);
        }
        agregarFiltroFecha(sql, parametros, "i.fecha_hora", filtros.fecha());
        sql.append(" ORDER BY i.fecha_hora DESC, i.id_intento DESC");
        return jdbc.query(sql.toString(), (rs, n) -> {
            java.time.OffsetDateTime marca = rs.getObject(
                    "fecha_hora", java.time.OffsetDateTime.class);
            return new RegistroEstadoRespuesta(
                    "RECHAZADO", rs.getLong("id_intento"),
                    rs.getString("codigo_sis") == null
                            ? rs.getString("identificador_intentado")
                            : rs.getString("codigo_sis"),
                    rs.getString("estudiante").isBlank()
                            ? "No identificado" : rs.getString("estudiante"),
                    rs.getString("nombre_examen"), rs.getString("ambiente"),
                    marca == null ? null : marca.toLocalDate().toString(),
                    marca == null ? null : marca.toLocalTime().toString(),
                    "RECHAZADO", rs.getString("motivo_rechazo"));
        }, parametros.toArray());
    }

    private void validarAcceso(Authentication autenticacion) {
        if (autenticacion == null || !autenticacion.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Debe iniciar sesion");
        }
        boolean esAdministrador = autenticacion.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMINISTRADOR".equals(a.getAuthority()));
        boolean tienePermiso = autenticacion.getAuthorities().stream()
                .anyMatch(a -> "GENERAR_REPORTES".equals(a.getAuthority()));
        if (!esAdministrador || !tienePermiso) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "No tiene permisos para consultar indicadores");
        }
    }

    private void validarExistenciaExamen(Long idExamen) {
        Boolean existe = jdbc.queryForObject("""
                SELECT EXISTS (SELECT 1 FROM academico.examen WHERE id_examen = ?)
                """, Boolean.class, idExamen);
        if (!Boolean.TRUE.equals(existe)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Examen no encontrado");
        }
    }

    private long contarIngresados(Long idExamen, String q, LocalDate fecha) {
        StringBuilder sql = new StringBuilder("""
                SELECT COUNT(*)
                FROM academico.ingreso_examen ie
                JOIN seguridad.usuario u ON u.id_usuario = ie.id_estudiante
                WHERE 1=1
                """);
        List<Object> parametros = new ArrayList<>();
        agregarFiltroExamen(sql, parametros, "ie.id_examen", idExamen);
        agregarFiltroEstudiante(sql, parametros, q, "u");
        agregarFiltroFecha(sql, parametros, "ie.fecha_hora_ingreso", fecha);
        return contar(sql, parametros);
    }

    private long contarPendientes(Long idExamen, String q, LocalDate fecha) {
        StringBuilder sql = new StringBuilder("""
                SELECT COUNT(DISTINCT (e.id_examen, me.id_estudiante))
                FROM academico.examen e
                JOIN academico.materia_estudiante me ON me.id_materia = e.id_materia
                JOIN seguridad.usuario u ON u.id_usuario = me.id_estudiante
                JOIN seguridad.rol r ON r.id_rol = u.id_rol
                WHERE u.activo = TRUE
                  AND UPPER(r.nombre_rol) = 'ESTUDIANTE'
                  AND NOT EXISTS (
                    SELECT 1 FROM academico.ingreso_examen ie
                    WHERE ie.id_examen = e.id_examen
                      AND ie.id_estudiante = me.id_estudiante
                  )
                """);
        List<Object> parametros = new ArrayList<>();
        agregarFiltroExamen(sql, parametros, "e.id_examen", idExamen);
        agregarFiltroEstudiante(sql, parametros, q, "u");
        // Un estudiante pendiente no tiene fecha de ingreso: se usa la fecha del examen.
        if (fecha != null) {
            sql.append(" AND e.fecha_examen = ?");
            parametros.add(Date.valueOf(fecha));
        }
        return contar(sql, parametros);
    }

    private long contarRechazados(Long idExamen, String q, LocalDate fecha) {
        StringBuilder sql = new StringBuilder("""
                SELECT COUNT(*)
                FROM academico.intento_ingreso_no_autorizado i
                LEFT JOIN seguridad.usuario u ON u.id_usuario = i.id_estudiante
                WHERE 1=1
                """);
        List<Object> parametros = new ArrayList<>();
        agregarFiltroExamen(sql, parametros, "i.id_examen", idExamen);
        if (!q.isBlank()) {
            String termino = "%" + q.toLowerCase() + "%";
            sql.append("""
                     AND (LOWER(COALESCE(i.identificador_intentado, '')) LIKE ?
                      OR LOWER(COALESCE(u.codigo_sis, '')) LIKE ?
                      OR LOWER(TRIM(CONCAT(COALESCE(u.nombre, ''), ' ', COALESCE(u.apellido, '')))) LIKE ?)
                    """);
            parametros.add(termino);
            parametros.add(termino);
            parametros.add(termino);
        }
        agregarFiltroFecha(sql, parametros, "i.fecha_hora", fecha);
        return contar(sql, parametros);
    }

    private void agregarFiltroExamen(
            StringBuilder sql, List<Object> parametros, String columna, Long idExamen) {
        if (idExamen != null) {
            sql.append(" AND ").append(columna).append(" = ?");
            parametros.add(idExamen);
        }
    }

    private void agregarFiltroEstudiante(
            StringBuilder sql, List<Object> parametros, String q, String aliasUsuario) {
        if (!q.isBlank()) {
            String termino = "%" + q.toLowerCase() + "%";
            sql.append(" AND (LOWER(COALESCE(").append(aliasUsuario)
                    .append(".codigo_sis, '')) LIKE ? OR LOWER(TRIM(CONCAT(COALESCE(")
                    .append(aliasUsuario).append(".nombre, ''), ' ', COALESCE(")
                    .append(aliasUsuario).append(".apellido, '')))) LIKE ?)");
            parametros.add(termino);
            parametros.add(termino);
        }
    }

    private void agregarFiltroFecha(
            StringBuilder sql, List<Object> parametros, String columna, LocalDate fecha) {
        if (fecha != null) {
            sql.append(" AND (")
                    .append(columna)
                    .append(" AT TIME ZONE 'America/La_Paz')::date = ?");
            parametros.add(Date.valueOf(fecha));
        }
    }

    private long contar(StringBuilder sql, List<Object> parametros) {
        Long resultado = jdbc.queryForObject(sql.toString(), Long.class, parametros.toArray());
        return resultado == null ? 0L : resultado;
    }
}
