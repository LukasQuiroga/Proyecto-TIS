package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.response.ReporteAsistenciaDetalleRespuesta;
import com.lacomarcasoft.dto.response.ReporteAsistenciaExamenRespuesta;
import com.lacomarcasoft.dto.response.ReporteAsistenciaHistorialRespuesta;
import com.lacomarcasoft.dto.response.ReporteAsistenciaRespuesta;
import com.lacomarcasoft.dto.response.ReporteAusentesHistorialRespuesta;
import com.lacomarcasoft.dto.response.ReporteAusentesRespuesta;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.sql.Date;
import java.sql.Time;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ReporteAsistenciaServicio {

    private static final String TIPO_ACCION = "GENERAR_REPORTE_ASISTENCIA";
    private static final String TIPO_ACCION_AUSENTES = "GENERAR_REPORTE_AUSENTES";
    private static final Pattern SNAPSHOT_AUSENTES = Pattern.compile("snapshot=([A-Za-z0-9_-]+)");
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

    @Transactional(readOnly = true)
    public ReporteAusentesRespuesta consultarAusentes(Long idExamen) {
        if (idExamen == null || idExamen <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Examen inválido");
        }

        ReporteAsistenciaExamenRespuesta examen = buscarExamen(idExamen);
        List<ReporteAsistenciaDetalleRespuesta> padron = consultarPadronAsociadoAExamen(idExamen);
        List<ReporteAsistenciaDetalleRespuesta> ausentes = padron.stream()
                .filter(estudiante -> "AUSENTE".equals(estudiante.estadoAsistencia()))
                .toList();
        int asistentes = padron.size() - ausentes.size();

        return new ReporteAusentesRespuesta(
                examen.idExamen(), examen.codigoExamen(), examen.nombreExamen(),
                examen.asignatura(), examen.fechaExamen(), examen.horaInicio(),
                ausentes.size(), asistentes, padron.size(), ausentes);
    }

    @Transactional
    public ReporteAusentesRespuesta generarAusentes(Long idExamen, Long idGenerador, String ipOrigen) {
        if (idExamen == null || idExamen <= 0 || idGenerador == null || idGenerador <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Examen o usuario inválido");
        }

        ReporteAusentesRespuesta reporte = consultarAusentes(idExamen);
        final String snapshot;
        try {
            snapshot = codificarReporteAusentes(reporte);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "No se pudo conservar el reporte de ausentes", ex);
        }

        String descripcion = "idExamen=" + idExamen
                + ";asistentes=" + reporte.totalAsistentes()
                + ";ausentes=" + reporte.totalAusentes()
                + ";padron=" + reporte.totalPadron()
                + ";snapshot=" + snapshot;
        jdbc.update("""
                INSERT INTO seguridad.log_actividad
                    (id_usuario, tipo_accion, descripcion, ip_origen, fecha, exitosa)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, TRUE)
                """, idGenerador, TIPO_ACCION_AUSENTES, descripcion, ipOrigen);
        return reporte;
    }

    @Transactional(readOnly = true)
    public List<ReporteAusentesHistorialRespuesta> historialAusentes(String busqueda) {
        String filtro = busqueda == null || busqueda.isBlank()
                ? null : "%" + busqueda.trim().toLowerCase() + "%";
        return jdbc.query("""
                SELECT l.id_log, l.fecha,
                       COALESCE(NULLIF(TRIM(CONCAT_WS(' ', u.nombre, u.apellido)), ''), 'Administrador') AS nombre_generador,
                       substring(l.descripcion FROM 'idExamen=([0-9]+)')::BIGINT AS id_examen,
                       COALESCE(substring(l.descripcion FROM 'ausentes=([0-9]+)')::INTEGER, 0) AS total_ausentes,
                       COALESCE(substring(l.descripcion FROM 'asistentes=([0-9]+)')::INTEGER, 0) AS total_asistentes,
                       COALESCE(substring(l.descripcion FROM 'padron=([0-9]+)')::INTEGER, 0) AS total_padron,
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
                """, (rs, fila) -> new ReporteAusentesHistorialRespuesta(
                rs.getLong("id_log"), rs.getObject("id_examen", Long.class),
                rs.getString("nombre_examen"), rs.getString("nombre_asignatura"),
                fecha(rs.getDate("fecha_examen")), hora(rs.getTime("hora_inicio")),
                rs.getObject("fecha", OffsetDateTime.class), rs.getString("nombre_generador"),
                rs.getInt("total_ausentes"), rs.getInt("total_asistentes"), rs.getInt("total_padron")
        ), TIPO_ACCION_AUSENTES, filtro, filtro, filtro, filtro);
    }

    @Transactional(readOnly = true)
    public ReporteAusentesRespuesta obtenerAusentes(Long idReporte) {
        if (idReporte == null || idReporte <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Identificador de reporte inválido");
        }
        String descripcion = jdbc.query("""
                SELECT descripcion FROM seguridad.log_actividad
                WHERE id_log = ? AND tipo_accion = ?
                """, rs -> rs.next() ? rs.getString("descripcion") : null,
                idReporte, TIPO_ACCION_AUSENTES);
        if (descripcion == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Reporte de ausentes no encontrado");
        }
        Matcher matcher = SNAPSHOT_AUSENTES.matcher(descripcion);
        if (!matcher.find()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El historial no contiene el reporte guardado");
        }
        try {
            byte[] snapshot = Base64.getUrlDecoder().decode(matcher.group(1));
            return decodificarReporteAusentes(snapshot);
        } catch (IOException | IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "No se pudo leer el reporte guardado", ex);
        }
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

    private List<ReporteAsistenciaDetalleRespuesta> consultarPadronAsociadoAExamen(Long idExamen) {
        return jdbc.query("""
                WITH ingresos AS (
                    SELECT id_estudiante, MIN(fecha_hora_ingreso) AS fecha_hora_ingreso
                    FROM academico.ingreso_examen
                    WHERE id_examen = ?
                    GROUP BY id_estudiante
                )
                SELECT u.id_usuario, u.codigo_sis,
                       TRIM(CONCAT(COALESCE(u.nombre, ''), ' ', COALESCE(u.apellido, ''))) AS nombre_completo,
                       i.fecha_hora_ingreso
                FROM academico.examen_estudiante ee
                JOIN seguridad.usuario u ON u.id_usuario = ee.id_estudiante
                JOIN seguridad.rol r ON r.id_rol = u.id_rol
                LEFT JOIN ingresos i ON i.id_estudiante = ee.id_estudiante
                WHERE ee.id_examen = ?
                  AND UPPER(r.nombre_rol) = 'ESTUDIANTE'
                ORDER BY LOWER(u.apellido), LOWER(u.nombre), u.codigo_sis NULLS LAST, u.id_usuario
                """, (rs, fila) -> {
            OffsetDateTime ingreso = rs.getObject("fecha_hora_ingreso", OffsetDateTime.class);
            return new ReporteAsistenciaDetalleRespuesta(
                    rs.getLong("id_usuario"), rs.getString("codigo_sis"), rs.getString("nombre_completo"),
                    ingreso == null ? "AUSENTE" : "ASISTIO", ingreso);
        }, idExamen, idExamen);
    }

    private static String codificarReporteAusentes(ReporteAusentesRespuesta reporte) throws IOException {
        try (ByteArrayOutputStream bytes = new ByteArrayOutputStream();
             DataOutputStream salida = new DataOutputStream(bytes)) {
            salida.writeInt(1);
            escribirLong(salida, reporte.idExamen());
            escribirTexto(salida, reporte.codigoExamen());
            escribirTexto(salida, reporte.nombreExamen());
            escribirTexto(salida, reporte.asignatura());
            escribirTexto(salida, reporte.fechaExamen() == null ? null : reporte.fechaExamen().toString());
            escribirTexto(salida, reporte.horaInicio() == null ? null : reporte.horaInicio().toString());
            salida.writeInt(reporte.totalAusentes());
            salida.writeInt(reporte.totalAsistentes());
            salida.writeInt(reporte.totalPadron());
            salida.writeInt(reporte.estudiantesAusentes().size());
            for (ReporteAsistenciaDetalleRespuesta estudiante : reporte.estudiantesAusentes()) {
                escribirLong(salida, estudiante.idEstudiante());
                escribirTexto(salida, estudiante.codigoEstudiante());
                escribirTexto(salida, estudiante.nombreCompleto());
                escribirTexto(salida, estudiante.estadoAsistencia());
                escribirTexto(salida, estudiante.fechaHoraIngreso() == null
                        ? null : estudiante.fechaHoraIngreso().toString());
            }
            return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes.toByteArray());
        }
    }

    private static ReporteAusentesRespuesta decodificarReporteAusentes(byte[] snapshot) throws IOException {
        try (DataInputStream entrada = new DataInputStream(new ByteArrayInputStream(snapshot))) {
            if (entrada.readInt() != 1) {
                throw new IOException("Versión de reporte guardado no reconocida");
            }
            Long idExamen = leerLong(entrada);
            String codigoExamen = leerTexto(entrada);
            String nombreExamen = leerTexto(entrada);
            String asignatura = leerTexto(entrada);
            String fechaExamen = leerTexto(entrada);
            String horaInicio = leerTexto(entrada);
            int totalAusentes = entrada.readInt();
            int totalAsistentes = entrada.readInt();
            int totalPadron = entrada.readInt();
            int cantidad = entrada.readInt();
            if (cantidad < 0 || cantidad > 250_000) {
                throw new IOException("Cantidad de estudiantes inválida en el reporte guardado");
            }

            List<ReporteAsistenciaDetalleRespuesta> ausentes = new java.util.ArrayList<>(cantidad);
            for (int i = 0; i < cantidad; i++) {
                Long idEstudiante = leerLong(entrada);
                String codigo = leerTexto(entrada);
                String nombre = leerTexto(entrada);
                String estado = leerTexto(entrada);
                String fechaIngreso = leerTexto(entrada);
                ausentes.add(new ReporteAsistenciaDetalleRespuesta(
                        idEstudiante, codigo, nombre, estado,
                        fechaIngreso == null ? null : OffsetDateTime.parse(fechaIngreso)));
            }
            if (entrada.available() != 0) {
                throw new IOException("El reporte guardado contiene datos adicionales");
            }
            return new ReporteAusentesRespuesta(
                    idExamen, codigoExamen, nombreExamen, asignatura,
                    fechaExamen == null ? null : LocalDate.parse(fechaExamen),
                    horaInicio == null ? null : LocalTime.parse(horaInicio),
                    totalAusentes, totalAsistentes, totalPadron, ausentes);
        } catch (RuntimeException ex) {
            throw new IOException("No se pudo interpretar el reporte guardado", ex);
        }
    }

    private static void escribirLong(DataOutputStream salida, Long valor) throws IOException {
        salida.writeBoolean(valor != null);
        if (valor != null) salida.writeLong(valor);
    }

    private static Long leerLong(DataInputStream entrada) throws IOException {
        return entrada.readBoolean() ? entrada.readLong() : null;
    }

    private static void escribirTexto(DataOutputStream salida, String valor) throws IOException {
        if (valor == null) {
            salida.writeInt(-1);
            return;
        }
        byte[] bytes = valor.getBytes(StandardCharsets.UTF_8);
        salida.writeInt(bytes.length);
        salida.write(bytes);
    }

    private static String leerTexto(DataInputStream entrada) throws IOException {
        int longitud = entrada.readInt();
        if (longitud == -1) return null;
        if (longitud < 0 || longitud > 1_000_000) {
            throw new IOException("Campo de texto inválido en el reporte guardado");
        }
        byte[] bytes = entrada.readNBytes(longitud);
        if (bytes.length != longitud) throw new IOException("Reporte guardado incompleto");
        return new String(bytes, StandardCharsets.UTF_8);
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
