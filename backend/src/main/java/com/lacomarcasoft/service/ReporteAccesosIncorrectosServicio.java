package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.response.ReporteAsistenciaExamenRespuesta;
import com.lacomarcasoft.dto.response.ReporteAccesosIncorrectosDetalleRespuesta;
import com.lacomarcasoft.dto.response.ReporteAccesosIncorrectosHistorialRespuesta;
import com.lacomarcasoft.dto.response.ReporteAccesosIncorrectosRespuesta;
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
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ReporteAccesosIncorrectosServicio {

    private static final String TIPO_ACCION = "GENERAR_REPORTE_ACCESOS_INCORRECTOS";

    private static final ZoneId ZONA_BOLIVIA = ZoneId.of("America/La_Paz");

    private static final DateTimeFormatter FORMATO_FECHA_HORA = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss XXX");

    private final JdbcTemplate jdbc;
    private final ReporteSnapshotServicio snapshotServicio;

    public ReporteAccesosIncorrectosServicio(
            JdbcTemplate jdbc,
            ReporteSnapshotServicio snapshotServicio) {

        this.jdbc = jdbc;
        this.snapshotServicio = snapshotServicio;
    }

    
    @Transactional
    public ReporteAccesosIncorrectosRespuesta generar(
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

        List<ReporteAccesosIncorrectosDetalleRespuesta> intentos =
                consultarIntentos(idExamen);

        int totalRechazados = intentos.size();

        int totalIngresosAutorizados =
                contarIngresosAutorizados(idExamen);

        int totalPadron = contarPadron(idExamen);

        String descripcion =
                "idExamen=" + idExamen +
                ";rechazados=" + totalRechazados +
                ";Reporte de accesos incorrectos: " +
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

        GeneracionReporte generacion =
                consultarGeneracion(idReporte);

        ReporteAccesosIncorrectosRespuesta reporte =
                new ReporteAccesosIncorrectosRespuesta(
                        idReporte,
                        idExamen,
                        examen.nombreExamen(),
                        examen.asignatura(),
                        examen.fechaExamen(),
                        examen.horaInicio(),
                        generacion.fechaGeneracion(),
                        generacion.nombreGenerador(),
                        totalRechazados,
                        totalIngresosAutorizados,
                        totalPadron,
                        intentos
                );

        snapshotServicio.guardar(idReporte, reporte);

        return reporte;
    }

    private GeneracionReporte consultarGeneracion(Long idReporte) {
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
                        rs.getObject(
                                "fecha",
                                OffsetDateTime.class
                        ),
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
                    "Reporte de accesos incorrectos no encontrado"
            );
        }

        return registros.get(0);
    }

    @Transactional(readOnly = true)
    public ReporteAccesosIncorrectosRespuesta obtener(
            Long idReporte) {

        if (idReporte == null || idReporte <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Identificador de reporte inválido"
            );
        }

        GeneracionReporte generacion =
                consultarGeneracion(idReporte);

        var snapshot = snapshotServicio.recuperar(
                idReporte,
                ReporteAccesosIncorrectosRespuesta.class
        );

        if (snapshot.isPresent()) {
            return snapshot.get();
        }

        ReporteAsistenciaExamenRespuesta examen =
                buscarExamen(generacion.idExamen());

        List<ReporteAccesosIncorrectosDetalleRespuesta> intentos =
                consultarIntentos(generacion.idExamen());

        int totalIngresosAutorizados =
                contarIngresosAutorizados(generacion.idExamen());

        int totalPadron =
                contarPadron(generacion.idExamen());

        return new ReporteAccesosIncorrectosRespuesta(
                generacion.idReporte(),
                generacion.idExamen(),
                examen.nombreExamen(),
                examen.asignatura(),
                examen.fechaExamen(),
                examen.horaInicio(),
                generacion.fechaGeneracion(),
                generacion.nombreGenerador(),
                intentos.size(),
                totalIngresosAutorizados,
                totalPadron,
                intentos
        );
    }

    @Transactional(readOnly = true)
    public List<ReporteAccesosIncorrectosHistorialRespuesta> historial(
            String busqueda) {

        String filtro = busqueda == null || busqueda.isBlank()
                ? null
                : "%" + busqueda.trim().toLowerCase() + "%";

        return jdbc.query("""
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
                    )::BIGINT AS id_examen,
                    COALESCE(
                        substring(
                            l.descripcion FROM 'rechazados=([0-9]+)'
                        )::INTEGER,
                        0
                    ) AS total_rechazados,
                    e.nombre_examen,
                    a.nombre_asignatura,
                    e.fecha_examen,
                    e.hora_inicio
                FROM seguridad.log_actividad l
                LEFT JOIN seguridad.usuario u
                    ON u.id_usuario = l.id_usuario
                LEFT JOIN academico.examen e
                    ON e.id_examen = substring(
                        l.descripcion FROM 'idExamen=([0-9]+)'
                    )::BIGINT
                LEFT JOIN academico.materia m
                    ON m.id_materia = e.id_materia
                LEFT JOIN academico.asignatura a
                    ON a.id_asignatura = m.id_asignatura
                WHERE l.tipo_accion = ?
                  AND (
                      CAST(? AS VARCHAR) IS NULL
                      OR LOWER(
                          COALESCE(e.nombre_examen, '')
                      ) LIKE ?
                      OR LOWER(
                          COALESCE(a.nombre_asignatura, '')
                      ) LIKE ?
                      OR LOWER(
                          COALESCE(u.nombre, '') || ' ' ||
                          COALESCE(u.apellido, '')
                      ) LIKE ?
                  )
                ORDER BY l.fecha DESC, l.id_log DESC
                LIMIT 500
                """,
                (rs, fila) -> new ReporteAccesosIncorrectosHistorialRespuesta(
                        rs.getLong("id_log"),
                        rs.getObject("id_examen", Long.class),
                        rs.getString("nombre_examen"),
                        rs.getString("nombre_asignatura"),
                        fecha(rs.getDate("fecha_examen")),
                        hora(rs.getTime("hora_inicio")),
                        rs.getObject(
                                "fecha",
                                OffsetDateTime.class),
                        rs.getString("nombre_generador"),
                        rs.getInt("total_rechazados")),
                TIPO_ACCION,
                filtro,
                filtro,
                filtro,
                filtro);
    }

    @Transactional(readOnly = true)
    public byte[] descargarCsv(Long idReporte) {

        ReporteAccesosIncorrectosRespuesta reporte = obtener(idReporte);

        StringBuilder csv = new StringBuilder();

        csv.append("Reporte de accesos incorrectos\r\n")
                .append("Examen;")
                .append(celda(reporte.nombreExamen()))
                .append("\r\nAsignatura;")
                .append(celda(reporte.asignatura()))
                .append("\r\nFecha del examen;")
                .append(celda(reporte.fechaExamen() == null
                        ? "—"
                        : reporte.fechaExamen().toString()))
                .append("\r\nHora del examen;")
                .append(celda(reporte.horaInicio() == null
                        ? "—"
                        : reporte.horaInicio().toString()))
                .append("\r\nTotal accesos incorrectos;")
                .append(reporte.totalRechazados())
                .append("\r\nIngresos autorizados;")
                .append(reporte.totalIngresosAutorizados())
                .append("\r\nTotal padrón;")
                .append(reporte.totalPadron())
                .append("\r\nGenerado por;")
                .append(celda(reporte.nombreGenerador()))
                .append("\r\nFecha de generación;")
                .append(celda(formatearFechaHora(
                        reporte.fechaGeneracion())))
                .append("\r\n\r\n")
                .append(
                        "Código SIS;Nombre completo;Carrera;" +
                                "Identificador intentado;Método;" +
                                "Motivo del rechazo;Fecha y hora;Estado\r\n");

        for (ReporteAccesosIncorrectosDetalleRespuesta intento : reporte.intentos()) {

            csv.append(celda(intento.codigoEstudiante()))
                    .append(';')
                    .append(celda(intento.nombreCompleto()))
                    .append(';')
                    .append(celda(intento.carrera()))
                    .append(';')
                    .append(celda(intento.identificadorIntentado()))
                    .append(';')
                    .append(celda(intento.metodoIdentificacion()))
                    .append(';')
                    .append(celda(intento.motivoRechazo()))
                    .append(';')
                    .append(celda(formatearFechaHora(
                            intento.fechaHora())))
                    .append(';')
                    .append(celda("Rechazado"))
                    .append("\r\n");
        }

        ByteArrayOutputStream salida = new ByteArrayOutputStream();

        salida.write(0xEF);
        salida.write(0xBB);
        salida.write(0xBF);

        salida.writeBytes(
                csv.toString().getBytes(StandardCharsets.UTF_8));

        return salida.toByteArray();
    }

    private ReporteAsistenciaExamenRespuesta buscarExamen(
            Long idExamen) {

        List<ReporteAsistenciaExamenRespuesta> examenes = jdbc.query("""
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
                (rs, fila) -> new ReporteAsistenciaExamenRespuesta(
                        rs.getLong("id_examen"),
                        rs.getString("codigo"),
                        rs.getString("nombre_examen"),
                        rs.getString("nombre_asignatura"),
                        fecha(rs.getDate("fecha_examen")),
                        hora(rs.getTime("hora_inicio"))),
                idExamen);

        if (examenes.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Examen no encontrado");
        }

        return examenes.get(0);
    }

    
    private List<ReporteAccesosIncorrectosDetalleRespuesta>
            consultarIntentos(Long idExamen) {

        return jdbc.query("""
                SELECT
                    i.id_intento,
                    i.id_estudiante,
                    u.codigo_sis,
                    TRIM(
                        CONCAT(
                            COALESCE(u.nombre, ''),
                            ' ',
                            COALESCE(u.apellido, '')
                        )
                    ) AS nombre_completo,
                    (
                        SELECT STRING_AGG(
                            DISTINCT c.nombre,
                            ', ' ORDER BY c.nombre
                        )
                        FROM academico.usuario_carrera uc
                        JOIN academico.carrera c
                            ON c.id_carrera = uc.id_carrera
                        WHERE uc.id_usuario = i.id_estudiante
                    ) AS carrera,
                    i.identificador_intentado,
                    i.metodo_identificacion,
                    i.motivo_rechazo,
                    i.fecha_hora
                FROM academico.intento_ingreso_no_autorizado i
                LEFT JOIN seguridad.usuario u
                    ON u.id_usuario = i.id_estudiante
                WHERE i.id_examen = ?
                ORDER BY
                    i.fecha_hora DESC,
                    i.id_intento DESC
                """,
                (rs, fila) ->
                        new ReporteAccesosIncorrectosDetalleRespuesta(
                                rs.getLong("id_intento"),
                                rs.getObject(
                                        "id_estudiante",
                                        Long.class
                                ),
                                rs.getString("codigo_sis"),
                                rs.getString("nombre_completo"),
                                rs.getString("carrera"),
                                rs.getString("identificador_intentado"),
                                rs.getString("metodo_identificacion"),
                                rs.getString("motivo_rechazo"),
                                rs.getObject(
                                        "fecha_hora",
                                        OffsetDateTime.class
                                )
                        ),
                idExamen
        );
    }

    private int contarIngresosAutorizados(Long idExamen) {

        Long total = jdbc.queryForObject("""
                SELECT COUNT(*)
                FROM academico.ingreso_examen
                WHERE id_examen = ?
                """,
                Long.class,
                idExamen);

        return Math.toIntExact(total == null ? 0L : total);
    }

    private int contarPadron(Long idExamen) {

        Long total = jdbc.queryForObject("""
                WITH estudiantes AS (
                    SELECT me.id_estudiante
                    FROM academico.materia_estudiante me
                    JOIN academico.examen e
                        ON e.id_materia = me.id_materia
                    WHERE e.id_examen = ?

                    UNION

                    SELECT ie.id_estudiante
                    FROM academico.ingreso_examen ie
                    WHERE ie.id_examen = ?
                )
                SELECT COUNT(*)
                FROM estudiantes est
                JOIN seguridad.usuario u
                    ON u.id_usuario = est.id_estudiante
                JOIN seguridad.rol r
                    ON r.id_rol = u.id_rol
                WHERE UPPER(r.nombre_rol) = 'ESTUDIANTE'
                """,
                Long.class,
                idExamen,
                idExamen);

        return Math.toIntExact(total == null ? 0L : total);
    }

    private static String formatearFechaHora(
            OffsetDateTime valor) {

        if (valor == null) {
            return "—";
        }

        return valor
                .atZoneSameInstant(ZONA_BOLIVIA)
                .format(FORMATO_FECHA_HORA);
    }

    private static LocalDate fecha(Date valor) {
        return valor == null ? null : valor.toLocalDate();
    }

    private static LocalTime hora(Time valor) {
        return valor == null ? null : valor.toLocalTime();
    }

    private static String celda(String valor) {
        if (valor == null) {
            return "\"\"";
        }

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
            Long idExamen) {
    }
}
