package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.response.ReporteAsistenciaExamenRespuesta;
import com.lacomarcasoft.dto.response.ReporteHorariosDetalleRespuesta;
import com.lacomarcasoft.dto.response.ReporteHorariosHistorialRespuesta;
import com.lacomarcasoft.dto.response.ReporteHorariosRespuesta;
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

@Service
public class ReporteHorariosServicio {

    private static final String TIPO_ACCION =
            "GENERAR_REPORTE_HORARIOS_INGRESO";

    private static final DateTimeFormatter FORMATO_FECHA_HORA =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss XXX");

    private final JdbcTemplate jdbc;

    public ReporteHorariosServicio(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional
    public ReporteHorariosRespuesta generar(
            Long idExamen,
            Long idGenerador,
            String ipOrigen) {

        if (idExamen == null || idExamen <= 0 ||
                idGenerador == null || idGenerador <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Examen o usuario inválido"
            );
        }

        ReporteAsistenciaExamenRespuesta examen =
                buscarExamen(idExamen);

        List<ReporteHorariosDetalleRespuesta> estudiantes =
                consultarIngresos(idExamen);

        int totalIngresos = estudiantes.size();

        String descripcion =
                "idExamen=" + idExamen +
                ";ingresos=" + totalIngresos +
                ";Reporte de horarios de ingreso: " +
                examen.nombreExamen();

        Long idReporte = jdbc.queryForObject("""
                INSERT INTO seguridad.log_actividad
                    (id_usuario, tipo_accion, descripcion,
                     ip_origen, fecha, exitosa)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, TRUE)
                RETURNING id_log
                """,
                Long.class,
                idGenerador,
                TIPO_ACCION,
                descripcion,
                ipOrigen
        );

        return obtener(idReporte);
    }

    @Transactional(readOnly = true)
    public ReporteHorariosRespuesta obtener(Long idReporte) {

        if (idReporte == null || idReporte <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Identificador de reporte inválido"
            );
        }

        List<GeneracionReporte> registros = jdbc.query("""
                SELECT
                    l.id_log,
                    l.fecha,
                    COALESCE(
                        NULLIF(
                            TRIM(CONCAT_WS(' ', u.nombre, u.apellido)),
                            ''
                        ),
                        'Administrador'
                    ) AS nombre_generador,
                    substring(
                        l.descripcion FROM 'idExamen=([0-9]+)'
                    )::BIGINT AS id_examen
                FROM seguridad.log_actividad l
                LEFT JOIN seguridad.usuario u
                    ON u.id_usuario = l.id_usuario
                WHERE l.id_log = ?
                  AND l.tipo_accion = ?
                """,
                (rs, fila) -> new GeneracionReporte(
                        rs.getLong("id_log"),
                        rs.getObject("fecha", OffsetDateTime.class),
                        rs.getString("nombre_generador"),
                        rs.getObject("id_examen", Long.class)
                ),
                idReporte,
                TIPO_ACCION
        );

        if (registros.isEmpty() ||
                registros.get(0).idExamen() == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Reporte de horarios no encontrado"
            );
        }

        GeneracionReporte generacion = registros.get(0);

        ReporteAsistenciaExamenRespuesta examen =
                buscarExamen(generacion.idExamen());

        List<ReporteHorariosDetalleRespuesta> estudiantes =
                consultarIngresos(generacion.idExamen());

        return new ReporteHorariosRespuesta(
                generacion.idReporte(),
                generacion.idExamen(),
                examen.nombreExamen(),
                examen.asignatura(),
                examen.fechaExamen(),
                examen.horaInicio(),
                generacion.fechaGeneracion(),
                generacion.nombreGenerador(),
                estudiantes.size(),
                estudiantes
        );
    }

    
    @Transactional(readOnly = true)
    public List<ReporteHorariosHistorialRespuesta> historial(String busqueda) {

        String filtro = busqueda == null || busqueda.isBlank()
                ? null
                : "%" + busqueda.trim().toLowerCase() + "%";

        return jdbc.query("""
                SELECT
                    l.id_log,
                    l.fecha,
                    COALESCE(
                        NULLIF(TRIM(CONCAT_WS(' ', u.nombre, u.apellido)), ''),
                        'Administrador'
                    ) AS nombre_generador,
                    substring(l.descripcion FROM 'idExamen=([0-9]+)')::BIGINT
                        AS id_examen,
                    COALESCE(
                        substring(l.descripcion FROM 'ingresos=([0-9]+)')::INTEGER,
                        0
                    ) AS total_ingresos,
                    e.nombre_examen,
                    a.nombre_asignatura,
                    e.fecha_examen,
                    e.hora_inicio
                FROM seguridad.log_actividad l
                LEFT JOIN seguridad.usuario u
                    ON u.id_usuario = l.id_usuario
                LEFT JOIN academico.examen e
                    ON e.id_examen =
                        substring(l.descripcion FROM 'idExamen=([0-9]+)')::BIGINT
                LEFT JOIN academico.materia m
                    ON m.id_materia = e.id_materia
                LEFT JOIN academico.asignatura a
                    ON a.id_asignatura = m.id_asignatura
                WHERE l.tipo_accion = ?
                AND (
                    CAST(? AS VARCHAR) IS NULL
                    OR LOWER(COALESCE(e.nombre_examen, '')) LIKE ?
                    OR LOWER(COALESCE(a.nombre_asignatura, '')) LIKE ?
                    OR LOWER(
                        COALESCE(u.nombre, '') || ' ' ||
                        COALESCE(u.apellido, '')
                    ) LIKE ?
                )
                ORDER BY l.fecha DESC, l.id_log DESC
                LIMIT 500
                """,
                (rs, fila) -> new ReporteHorariosHistorialRespuesta(
                        rs.getLong("id_log"),
                        rs.getObject("id_examen", Long.class),
                        rs.getString("nombre_examen"),
                        rs.getString("nombre_asignatura"),
                        fecha(rs.getDate("fecha_examen")),
                        hora(rs.getTime("hora_inicio")),
                        rs.getObject("fecha", OffsetDateTime.class),
                        rs.getString("nombre_generador"),
                        rs.getInt("total_ingresos")
                ),
                TIPO_ACCION,
                filtro,
                filtro,
                filtro,
                filtro
        );
    }


    @Transactional(readOnly = true)
    public byte[] descargarCsv(Long idReporte) {

        ReporteHorariosRespuesta reporte = obtener(idReporte);

        StringBuilder csv = new StringBuilder();

        csv.append("Reporte de horarios de ingreso\r\n")
                .append("Examen;")
                .append(celda(reporte.nombreExamen()))
                .append("\r\nAsignatura;")
                .append(celda(reporte.asignatura()))
                .append("\r\nFecha del examen;")
                .append(celda(reporte.fechaExamen() == null
                        ? "—" : reporte.fechaExamen().toString()))
                .append("\r\nHora del examen;")
                .append(celda(reporte.horaInicio() == null
                        ? "—" : reporte.horaInicio().toString()))
                .append("\r\nTotal ingresos;")
                .append(reporte.totalIngresos())
                .append("\r\nGenerado por;")
                .append(celda(reporte.nombreGenerador()))
                .append("\r\nFecha de generación;")
                .append(celda(reporte.fechaGeneracion()
                        .format(FORMATO_FECHA_HORA)))
                .append("\r\n\r\n")
                .append("Código;Nombre completo;Fecha y hora de ingreso\r\n");

        for (ReporteHorariosDetalleRespuesta estudiante
                : reporte.estudiantes()) {

            csv.append(celda(estudiante.codigoEstudiante()))
                    .append(';')
                    .append(celda(estudiante.nombreCompleto()))
                    .append(';')
                    .append(celda(estudiante.fechaHoraIngreso()
                            .format(FORMATO_FECHA_HORA)))
                    .append("\r\n");
        }

        ByteArrayOutputStream salida =
                new ByteArrayOutputStream();

        // BOM para compatibilidad con Excel.
        salida.write(0xEF);
        salida.write(0xBB);
        salida.write(0xBF);

        salida.writeBytes(
                csv.toString().getBytes(StandardCharsets.UTF_8)
        );

        return salida.toByteArray();
    }

    private ReporteAsistenciaExamenRespuesta buscarExamen(
            Long idExamen) {

        List<ReporteAsistenciaExamenRespuesta> examenes =
                jdbc.query("""
                        SELECT
                            e.id_examen,
                            e.codigo,
                            e.nombre_examen,
                            a.nombre_asignatura,
                            e.fecha_examen,
                            e.hora_inicio
                        FROM academico.examen e
                        JOIN academico.materia m
                            ON m.id_materia = e.id_materia
                        JOIN academico.asignatura a
                            ON a.id_asignatura = m.id_asignatura
                        WHERE e.id_examen = ?
                        """,
                        (rs, fila) ->
                                new ReporteAsistenciaExamenRespuesta(
                                        rs.getLong("id_examen"),
                                        rs.getString("codigo"),
                                        rs.getString("nombre_examen"),
                                        rs.getString("nombre_asignatura"),
                                        fecha(rs.getDate("fecha_examen")),
                                        hora(rs.getTime("hora_inicio"))
                                ),
                        idExamen
                );

        if (examenes.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Examen no encontrado"
            );
        }

        return examenes.get(0);
    }

    private List<ReporteHorariosDetalleRespuesta> consultarIngresos(
            Long idExamen) {

        return jdbc.query("""
                WITH ingresos AS (
                    SELECT DISTINCT ON (ie.id_estudiante)
                        ie.id_estudiante,
                        ie.fecha_hora_ingreso
                    FROM academico.ingreso_examen ie
                    WHERE ie.id_examen = ?
                      AND ie.fecha_hora_ingreso IS NOT NULL
                    ORDER BY
                        ie.id_estudiante,
                        ie.fecha_hora_ingreso ASC
                )
                SELECT
                    u.id_usuario AS id_estudiante,
                    u.codigo_sis AS codigo_estudiante,
                    TRIM(
                        CONCAT(
                            COALESCE(u.nombre, ''),
                            ' ',
                            COALESCE(u.apellido, '')
                        )
                    ) AS nombre_completo,
                    i.fecha_hora_ingreso
                FROM ingresos i
                JOIN seguridad.usuario u
                    ON u.id_usuario = i.id_estudiante
                JOIN seguridad.rol r
                    ON r.id_rol = u.id_rol
                WHERE UPPER(r.nombre_rol) = 'ESTUDIANTE'
                ORDER BY
                    i.fecha_hora_ingreso ASC,
                    u.id_usuario ASC
                """,
                (rs, fila) -> new ReporteHorariosDetalleRespuesta(
                        rs.getLong("id_estudiante"),
                        rs.getString("codigo_estudiante"),
                        rs.getString("nombre_completo"),
                        rs.getObject(
                                "fecha_hora_ingreso",
                                OffsetDateTime.class
                        )
                ),
                idExamen
        );
    }

    private static LocalDate fecha(Date valor) {
        return valor == null ? null : valor.toLocalDate();
    }

    private static LocalTime hora(Time valor) {
        return valor == null ? null : valor.toLocalTime();
    }

    private static String celda(String valor) {
        if (valor == null) return "\"\"";

        String seguro = valor;

        if (!seguro.isEmpty() &&
                "=+-@".indexOf(seguro.charAt(0)) >= 0) {
            seguro = "'" + seguro;
        }

        return "\"" + seguro.replace("\"", "\"\"") + "\"";
    }

    private record GeneracionReporte(
            Long idReporte,
            OffsetDateTime fechaGeneracion,
            String nombreGenerador,
            Long idExamen
    ) {}
}
