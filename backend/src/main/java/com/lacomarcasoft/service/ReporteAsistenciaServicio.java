package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.response.ReporteAsistenciaDetalleRespuesta;
import com.lacomarcasoft.dto.response.ReporteAsistenciaExamenRespuesta;
import com.lacomarcasoft.dto.response.ReporteAsistenciaHistorialRespuesta;
import com.lacomarcasoft.dto.response.ReporteAsistenciaRespuesta;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.sql.Date;
import java.sql.Time;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ReporteAsistenciaServicio {

    private static final String TIPO_ACCION = "GENERAR_REPORTE_ASISTENCIA";
    private static final Pattern ID_EXAMEN = Pattern.compile("idExamen=(\\d+)");
    private static final DateTimeFormatter FORMATO_FECHA_HORA =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss XXX");

    private final JdbcTemplate jdbc;

    public ReporteAsistenciaServicio(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    public List<ReporteAsistenciaExamenRespuesta> listarExamenes(String busqueda, LocalDate fecha) {
        StringBuilder sql = new StringBuilder("""
                SELECT e.id_examen, e.codigo, e.nombre_examen,
                       a.nombre_asignatura, e.fecha_examen, e.hora_inicio
                FROM academico.examen e
                JOIN academico.materia m ON m.id_materia = e.id_materia
                JOIN academico.asignatura a ON a.id_asignatura = m.id_asignatura
                WHERE 1 = 1
                """);
        java.util.ArrayList<Object> parametros = new java.util.ArrayList<>();
        if (busqueda != null && !busqueda.isBlank()) {
            sql.append(" AND (LOWER(e.nombre_examen) LIKE ? OR LOWER(a.nombre_asignatura) LIKE ? OR LOWER(COALESCE(e.codigo, '')) LIKE ?)");
            String filtro = "%" + busqueda.trim().toLowerCase() + "%";
            parametros.add(filtro);
            parametros.add(filtro);
            parametros.add(filtro);
        }
        if (fecha != null) {
            sql.append(" AND e.fecha_examen = ?");
            parametros.add(Date.valueOf(fecha));
        }
        sql.append(" ORDER BY e.fecha_examen DESC NULLS LAST, e.hora_inicio DESC NULLS LAST, e.id_examen DESC");

        return jdbc.query(sql.toString(), (rs, fila) -> new ReporteAsistenciaExamenRespuesta(
                rs.getLong("id_examen"), rs.getString("codigo"), rs.getString("nombre_examen"),
                rs.getString("nombre_asignatura"), fecha(rs.getDate("fecha_examen")),
                hora(rs.getTime("hora_inicio"))
        ), parametros.toArray());
    }

    @Transactional
    public ReporteAsistenciaRespuesta generar(Long idExamen, Long idGenerador, String ipOrigen) {
        if (idExamen == null || idExamen <= 0 || idGenerador == null || idGenerador <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Examen o usuario inválido");
        }

        ReporteAsistenciaExamenRespuesta examen = buscarExamen(idExamen);
        List<ReporteAsistenciaDetalleRespuesta> estudiantes = consultarPadron(idExamen);
        int asistentes = (int) estudiantes.stream()
                .filter(estudiante -> "ASISTIO".equals(estudiante.estadoAsistencia()))
                .count();
        int ausentes = estudiantes.size() - asistentes;
        String descripcion = "idExamen=" + idExamen
                + ";asistentes=" + asistentes
                + ";ausentes=" + ausentes
                + ";Reporte de asistencia: " + examen.nombreExamen();

        Long idRegistro = jdbc.queryForObject("""
                INSERT INTO seguridad.log_actividad
                    (id_usuario, tipo_accion, descripcion, ip_origen, fecha, exitosa)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, TRUE)
                RETURNING id_log
                """, Long.class, idGenerador, TIPO_ACCION, descripcion, ipOrigen);

        return obtener(idRegistro);
    }

    @Transactional(readOnly = true)
    public ReporteAsistenciaRespuesta obtener(Long idReporte) {
        if (idReporte == null || idReporte <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Identificador de reporte inválido");
        }

        List<GeneracionReporte> registros = jdbc.query("""
                SELECT l.id_log, l.fecha, l.id_usuario,
                       COALESCE(NULLIF(TRIM(CONCAT_WS(' ', u.nombre, u.apellido)), ''), 'Administrador') AS nombre_generador,
                       substring(l.descripcion FROM 'idExamen=([0-9]+)') AS id_examen
                FROM seguridad.log_actividad l
                LEFT JOIN seguridad.usuario u ON u.id_usuario = l.id_usuario
                WHERE l.id_log = ? AND l.tipo_accion = ?
                """, (rs, fila) -> new GeneracionReporte(
                rs.getLong("id_log"), rs.getObject("fecha", OffsetDateTime.class),
                rs.getObject("id_usuario", Long.class), rs.getString("nombre_generador"),
                rs.getString("id_examen") == null ? null : Long.valueOf(rs.getString("id_examen"))
        ), idReporte, TIPO_ACCION);

        if (registros.isEmpty() || registros.get(0).idExamen() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Reporte de asistencia no encontrado");
        }
        GeneracionReporte generacion = registros.get(0);
        ReporteAsistenciaExamenRespuesta examen = buscarExamen(generacion.idExamen());
        List<ReporteAsistenciaDetalleRespuesta> estudiantes = consultarPadron(generacion.idExamen());
        int asistentes = (int) estudiantes.stream()
                .filter(estudiante -> "ASISTIO".equals(estudiante.estadoAsistencia()))
                .count();
        int ausentes = estudiantes.size() - asistentes;

        return new ReporteAsistenciaRespuesta(
                generacion.idLog(), generacion.idExamen(), examen.nombreExamen(), examen.asignatura(),
                examen.fechaExamen(), examen.horaInicio(), generacion.fechaGeneracion(),
                generacion.nombreGenerador(), estudiantes.size(), asistentes, ausentes, estudiantes);
    }

    @Transactional(readOnly = true)
    public List<ReporteAsistenciaHistorialRespuesta> historial(String busqueda) {
        String filtro = busqueda == null || busqueda.isBlank()
                ? null : "%" + busqueda.trim().toLowerCase() + "%";
        return jdbc.query("""
                SELECT l.id_log, l.fecha,
                       COALESCE(NULLIF(TRIM(CONCAT_WS(' ', u.nombre, u.apellido)), ''), 'Administrador') AS nombre_generador,
                       substring(l.descripcion FROM 'idExamen=([0-9]+)')::BIGINT AS id_examen,
                       COALESCE(substring(l.descripcion FROM 'asistentes=([0-9]+)')::INTEGER, 0) AS total_asistentes,
                       COALESCE(substring(l.descripcion FROM 'ausentes=([0-9]+)')::INTEGER, 0) AS total_ausentes,
                       e.nombre_examen, a.nombre_asignatura, e.fecha_examen, e.hora_inicio
                FROM seguridad.log_actividad l
                LEFT JOIN seguridad.usuario u ON u.id_usuario = l.id_usuario
                LEFT JOIN academico.examen e
                    ON e.id_examen = substring(l.descripcion FROM 'idExamen=([0-9]+)')::BIGINT
                LEFT JOIN academico.materia m ON m.id_materia = e.id_materia
                LEFT JOIN academico.asignatura a ON a.id_asignatura = m.id_asignatura
                WHERE l.tipo_accion = ?
                  AND (CAST(? AS VARCHAR) IS NULL OR LOWER(COALESCE(e.nombre_examen, '')) LIKE ?
                       OR LOWER(COALESCE(a.nombre_asignatura, '')) LIKE ?
                       OR LOWER(COALESCE(u.nombre, '') || ' ' || COALESCE(u.apellido, '')) LIKE ?)
                ORDER BY l.fecha DESC, l.id_log DESC
                LIMIT 500
                """, (rs, fila) -> new ReporteAsistenciaHistorialRespuesta(
                rs.getLong("id_log"), rs.getObject("id_examen", Long.class),
                rs.getString("nombre_examen"), rs.getString("nombre_asignatura"),
                fecha(rs.getDate("fecha_examen")), hora(rs.getTime("hora_inicio")),
                rs.getObject("fecha", OffsetDateTime.class), rs.getString("nombre_generador"),
                rs.getInt("total_asistentes"), rs.getInt("total_ausentes")
        ), TIPO_ACCION, filtro, filtro, filtro, filtro);
    }

    @Transactional(readOnly = true)
    public byte[] descargarCsv(Long idReporte) {
        ReporteAsistenciaRespuesta reporte = obtener(idReporte);
        ByteArrayOutputStream salida = new ByteArrayOutputStream();
        salida.write(0xEF);
        salida.write(0xBB);
        salida.write(0xBF);
        StringBuilder csv = new StringBuilder();
        csv.append("Reporte de asistencia\r\nExamen;").append(celda(reporte.nombreExamen()))
                .append("\r\nAsignatura;").append(celda(reporte.asignatura()))
                .append("\r\nFecha del examen;").append(celda(reporte.fechaExamen() == null ? "—" : reporte.fechaExamen().toString()))
                .append("\r\nHora del examen;").append(celda(reporte.horaInicio() == null ? "—" : reporte.horaInicio().toString()))
                .append("\r\nTotal padrón;").append(reporte.totalPadron())
                .append("\r\nAsistentes;").append(reporte.totalAsistentes())
                .append("\r\nAusentes;").append(reporte.totalAusentes())
                .append("\r\nGenerado por;").append(celda(reporte.nombreGenerador()))
                .append("\r\nFecha de generación;").append(celda(reporte.fechaGeneracion().format(FORMATO_FECHA_HORA)))
                .append("\r\n\r\nCódigo;Nombre completo;Estado;Fecha y hora de ingreso\r\n");
        for (ReporteAsistenciaDetalleRespuesta estudiante : reporte.estudiantes()) {
            csv.append(celda(estudiante.codigoEstudiante())).append(';')
                    .append(celda(estudiante.nombreCompleto())).append(';')
                    .append(estudiante.estadoAsistencia().equals("ASISTIO") ? "Asistió" : "Ausente").append(';')
                    .append(celda(estudiante.fechaHoraIngreso() == null ? "—" : estudiante.fechaHoraIngreso().format(FORMATO_FECHA_HORA)))
                    .append("\r\n");
        }
        salida.writeBytes(csv.toString().getBytes(StandardCharsets.UTF_8));
        return salida.toByteArray();
    }

    private ReporteAsistenciaExamenRespuesta buscarExamen(Long idExamen) {
        List<ReporteAsistenciaExamenRespuesta> examenes = jdbc.query("""
                SELECT e.id_examen, e.codigo, e.nombre_examen,
                       a.nombre_asignatura, e.fecha_examen, e.hora_inicio
                FROM academico.examen e
                JOIN academico.materia m ON m.id_materia = e.id_materia
                JOIN academico.asignatura a ON a.id_asignatura = m.id_asignatura
                WHERE e.id_examen = ?
                """, (rs, fila) -> new ReporteAsistenciaExamenRespuesta(
                rs.getLong("id_examen"), rs.getString("codigo"), rs.getString("nombre_examen"),
                rs.getString("nombre_asignatura"), fecha(rs.getDate("fecha_examen")),
                hora(rs.getTime("hora_inicio"))
        ), idExamen);
        if (examenes.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Examen no encontrado");
        }
        return examenes.get(0);
    }

    private List<ReporteAsistenciaDetalleRespuesta> consultarPadron(Long idExamen) {
        return jdbc.query("""
                WITH estudiantes AS (
                    SELECT me.id_estudiante
                    FROM academico.materia_estudiante me
                    JOIN academico.examen e ON e.id_materia = me.id_materia
                    WHERE e.id_examen = ?
                    UNION
                    SELECT ie.id_estudiante
                    FROM academico.ingreso_examen ie
                    WHERE ie.id_examen = ?
                ), ingresos AS (
                    SELECT DISTINCT ON (id_estudiante) id_estudiante, fecha_hora_ingreso
                    FROM academico.ingreso_examen
                    WHERE id_examen = ?
                    ORDER BY id_estudiante, fecha_hora_ingreso
                )
                SELECT u.id_usuario, u.codigo_sis,
                       TRIM(CONCAT(COALESCE(u.nombre, ''), ' ', COALESCE(u.apellido, ''))) AS nombre_completo,
                       i.fecha_hora_ingreso
                FROM estudiantes est
                JOIN seguridad.usuario u ON u.id_usuario = est.id_estudiante
                JOIN seguridad.rol r ON r.id_rol = u.id_rol
                LEFT JOIN ingresos i ON i.id_estudiante = u.id_usuario
                WHERE UPPER(r.nombre_rol) = 'ESTUDIANTE'
                ORDER BY LOWER(u.apellido), LOWER(u.nombre), u.codigo_sis NULLS LAST, u.id_usuario
                """, (rs, fila) -> {
            OffsetDateTime ingreso = rs.getObject("fecha_hora_ingreso", OffsetDateTime.class);
            return new ReporteAsistenciaDetalleRespuesta(
                    rs.getLong("id_usuario"), rs.getString("codigo_sis"), rs.getString("nombre_completo"),
                    ingreso == null ? "AUSENTE" : "ASISTIO", ingreso);
        }, idExamen, idExamen, idExamen);
    }

    private static LocalDate fecha(Date fecha) {
        return fecha == null ? null : fecha.toLocalDate();
    }

    private static LocalTime hora(Time hora) {
        return hora == null ? null : hora.toLocalTime();
    }

    private static String celda(String valor) {
        if (valor == null) return "\"\"";
        String seguro = valor;
        if (!seguro.isEmpty() && "=+-@".indexOf(seguro.charAt(0)) >= 0) seguro = "'" + seguro;
        return "\"" + seguro.replace("\"", "\"\"") + "\"";
    }

    private record GeneracionReporte(
            Long idLog,
            OffsetDateTime fechaGeneracion,
            Long idGenerador,
            String nombreGenerador,
            Long idExamen
    ) {}
}
