package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.response.MensajeRespuesta;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class IntentoIngresoNoAutorizadoServicio {
    private final JdbcTemplate jdbc;
    private final AccesoExamenDocenteServicio acceso;

    public IntentoIngresoNoAutorizadoServicio(JdbcTemplate jdbc, AccesoExamenDocenteServicio acceso) {
        this.jdbc = jdbc;
        this.acceso = acceso;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrar(Long examen, Long estudiante, Long responsable, String identificador,
                          String metodo, String motivo, String fotoReferencia) {
        jdbc.update("""
            INSERT INTO academico.intento_ingreso_no_autorizado
                (id_examen, id_estudiante, id_responsable, identificador_intentado,
                 metodo_identificacion, motivo_rechazo, foto_recurso)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, examen, estudiante, responsable, identificador, metodo,
            motivo == null ? "Ingreso no autorizado" : motivo.substring(0, Math.min(255, motivo.length())),
            fotoReferencia);
    }

    public record Intento(
        Long idIntento,
        Long idExamen,
        Long idEstudiante,
        String identificadorIntentado,
        String nombreEstudiante,
        String nombreExamen,
        String metodoIdentificacion,
        String motivoRechazo,
        String tituloMotivo,
        String descripcionMotivo,
        String responsable,
        OffsetDateTime fechaHora,
        String estado,
        String veredicto,
        OffsetDateTime fechaHoraResolucion,
        String fotoReferencia,
        String codigoUniversitario,
        String carnetIdentidad
    ) {}

    @Transactional(readOnly = true)
    public List<Intento> listar(String q, Long idExamen, String motivo) {
        Long docente = acceso.obtenerDocenteAutenticado();
        StringBuilder sql = new StringBuilder("""
            SELECT i.id_intento, i.id_examen, i.id_estudiante, i.identificador_intentado,
                   TRIM(CONCAT(COALESCE(u.nombre, ''), ' ', COALESCE(u.apellido, ''))) AS estudiante,
                   e.nombre_examen, i.metodo_identificacion, i.motivo_rechazo,
                   COALESCE(h.titulo_motivo_personalizado, mi.titulo) AS titulo_motivo,
                   COALESCE(h.motivo_personalizado, mi.motivo) AS descripcion_motivo,
                   TRIM(CONCAT(COALESCE(r.nombre, ''), ' ', COALESCE(r.apellido, ''))) AS responsable,
                   i.fecha_hora,
                   COALESCE(i.estado, 'PENDIENTE') AS estado,
                   i.veredicto,
                   i.fecha_hora_resolucion,
                   i.foto_recurso,
                   u.carnet_identidad AS carnet_identidad,
                   u.codigo_sis AS codigo_sis
            FROM academico.intento_ingreso_no_autorizado i
            JOIN academico.examen e ON e.id_examen = i.id_examen
            JOIN academico.materia m ON m.id_materia = e.id_materia
            LEFT JOIN seguridad.usuario u ON u.id_usuario = i.id_estudiante
            LEFT JOIN academico.habilitacion_estudiante h
                ON h.id_examen = i.id_examen AND h.id_estudiante = i.id_estudiante
            LEFT JOIN academico.motivo_inhabilitacion mi ON mi.id_motivo = h.id_motivo
            JOIN seguridad.usuario r ON r.id_usuario = i.id_responsable
            WHERE m.id_docente = ?
            """);
        List<Object> args = new ArrayList<>();
        args.add(docente);
        if (idExamen != null && idExamen > 0) {
            sql.append(" AND i.id_examen = ?"); args.add(idExamen);
        }
        if (q != null && !q.isBlank()) {
            sql.append(" AND (LOWER(COALESCE(i.identificador_intentado,'')) LIKE ? OR LOWER(CONCAT(COALESCE(u.nombre,''),' ',COALESCE(u.apellido,''))) LIKE ?)");
            String term = "%" + q.trim().toLowerCase() + "%";
            args.add(term); args.add(term);
        }
        if (motivo != null && !motivo.isBlank()) {
            sql.append(" AND i.motivo_rechazo = ?"); args.add(motivo.trim());
        }
        sql.append(" ORDER BY i.fecha_hora DESC, i.id_intento DESC LIMIT 500");
        return jdbc.query(sql.toString(), (rs, n) -> new Intento(
            rs.getLong("id_intento"), rs.getLong("id_examen"), rs.getObject("id_estudiante", Long.class),
            rs.getString("identificador_intentado"), rs.getString("estudiante"), rs.getString("nombre_examen"),
            rs.getString("metodo_identificacion"), rs.getString("motivo_rechazo"),
            rs.getString("titulo_motivo"), rs.getString("descripcion_motivo"),
            rs.getString("responsable"), rs.getObject("fecha_hora", OffsetDateTime.class),
            rs.getString("estado"), rs.getString("veredicto"), rs.getObject("fecha_hora_resolucion", OffsetDateTime.class),
            rs.getString("foto_recurso"),
            rs.getString("carnet_identidad"), rs.getString("codigo_sis")
        ), args.toArray());
    }

    @Transactional(readOnly = true)
    public Intento detalle(Long idIntento) {
        if (idIntento == null || idIntento <= 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Identificador invalido"
            );
        }

        List<Intento> resultados = jdbc.query("""
            SELECT i.id_intento, i.id_examen, i.id_estudiante, i.identificador_intentado,
                   TRIM(CONCAT(COALESCE(u.nombre, ''), ' ', COALESCE(u.apellido, ''))) AS estudiante,
                   e.nombre_examen, i.metodo_identificacion, i.motivo_rechazo,
                   COALESCE(h.titulo_motivo_personalizado, mi.titulo) AS titulo_motivo,
                   COALESCE(h.motivo_personalizado, mi.motivo) AS descripcion_motivo,
                   TRIM(CONCAT(COALESCE(r.nombre, ''), ' ', COALESCE(r.apellido, ''))) AS responsable,
                   i.fecha_hora,
                   COALESCE(i.estado, 'PENDIENTE') AS estado,
                   i.veredicto,
                   i.fecha_hora_resolucion,
                   i.foto_recurso,
                   u.carnet_identidad AS carnet_identidad,
                   u.codigo_sis AS codigo_sis
            FROM academico.intento_ingreso_no_autorizado i
            JOIN academico.examen e ON e.id_examen = i.id_examen
            JOIN academico.materia m ON m.id_materia = e.id_materia
            LEFT JOIN seguridad.usuario u ON u.id_usuario = i.id_estudiante
            LEFT JOIN academico.habilitacion_estudiante h
                ON h.id_examen = i.id_examen AND h.id_estudiante = i.id_estudiante
            LEFT JOIN academico.motivo_inhabilitacion mi ON mi.id_motivo = h.id_motivo
            JOIN seguridad.usuario r ON r.id_usuario = i.id_responsable
            WHERE i.id_intento = ?
            """,
            (rs, n) -> new Intento(
                rs.getLong("id_intento"), rs.getLong("id_examen"), rs.getObject("id_estudiante", Long.class),
                rs.getString("identificador_intentado"), rs.getString("estudiante"), rs.getString("nombre_examen"),
                rs.getString("metodo_identificacion"), rs.getString("motivo_rechazo"),
                rs.getString("titulo_motivo"), rs.getString("descripcion_motivo"),
                rs.getString("responsable"), rs.getObject("fecha_hora", OffsetDateTime.class),
                rs.getString("estado"), rs.getString("veredicto"), rs.getObject("fecha_hora_resolucion", OffsetDateTime.class),
                rs.getString("foto_recurso"),
                rs.getString("carnet_identidad"), rs.getString("codigo_sis")
            ),
            idIntento
        );

        if (resultados.isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Incidencia no encontrada"
            );
        }

        Intento intento = resultados.get(0);

        acceso.verificarExamenActual(intento.idExamen());

        return intento;
    }

    @Transactional
    public MensajeRespuesta resolver(Long idIntento, String veredicto) {
        if (idIntento == null || idIntento <= 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Identificador invalido"
            );
        }

        String veredictoLimpio = veredicto == null ? "" : veredicto.trim();

        if (veredictoLimpio.isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "El veredicto es obligatorio"
            );
        }

        if (veredictoLimpio.length() > 300) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "El veredicto no puede superar 300 caracteres"
            );
        }

        if (!veredictoLimpio.matches("[\\p{L}\\p{N} ]+")) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "El veredicto solo admite letras, numeros y espacios"
            );
        }

        List<Intento> resultados = jdbc.query("""
            SELECT i.id_intento, i.id_examen, i.id_estudiante, i.identificador_intentado,
                   TRIM(CONCAT(COALESCE(u.nombre, ''), ' ', COALESCE(u.apellido, ''))) AS estudiante,
                   e.nombre_examen, i.metodo_identificacion, i.motivo_rechazo,
                   COALESCE(h.titulo_motivo_personalizado, mi.titulo) AS titulo_motivo,
                   COALESCE(h.motivo_personalizado, mi.motivo) AS descripcion_motivo,
                   TRIM(CONCAT(COALESCE(r.nombre, ''), ' ', COALESCE(r.apellido, ''))) AS responsable,
                   i.fecha_hora,
                   COALESCE(i.estado, 'PENDIENTE') AS estado,
                   i.veredicto,
                   i.fecha_hora_resolucion,
                   i.foto_recurso,
                   u.carnet_identidad AS carnet_identidad,
                   u.codigo_sis AS codigo_sis
            FROM academico.intento_ingreso_no_autorizado i
            JOIN academico.examen e ON e.id_examen = i.id_examen
            JOIN academico.materia m ON m.id_materia = e.id_materia
            LEFT JOIN seguridad.usuario u ON u.id_usuario = i.id_estudiante
            LEFT JOIN academico.habilitacion_estudiante h
                ON h.id_examen = i.id_examen AND h.id_estudiante = i.id_estudiante
            LEFT JOIN academico.motivo_inhabilitacion mi ON mi.id_motivo = h.id_motivo
            JOIN seguridad.usuario r ON r.id_usuario = i.id_responsable
            WHERE i.id_intento = ?
            """,
            (rs, n) -> new Intento(
                rs.getLong("id_intento"), rs.getLong("id_examen"), rs.getObject("id_estudiante", Long.class),
                rs.getString("identificador_intentado"), rs.getString("estudiante"), rs.getString("nombre_examen"),
                rs.getString("metodo_identificacion"), rs.getString("motivo_rechazo"),
                rs.getString("titulo_motivo"), rs.getString("descripcion_motivo"),
                rs.getString("responsable"), rs.getObject("fecha_hora", OffsetDateTime.class),
                rs.getString("estado"), rs.getString("veredicto"), rs.getObject("fecha_hora_resolucion", OffsetDateTime.class),
                rs.getString("foto_recurso"),
                rs.getString("carnet_identidad"), rs.getString("codigo_sis")
            ),
            idIntento
        );

        if (resultados.isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Incidencia no encontrada"
            );
        }

        Intento intento = resultados.get(0);

        if ("RESUELTA".equalsIgnoreCase(intento.estado())) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "La incidencia ya fue resuelta"
            );
        }

        acceso.verificarExamenActual(intento.idExamen());

        Long idDocente = acceso.obtenerDocenteAutenticado();

        jdbc.update("""
            UPDATE academico.intento_ingreso_no_autorizado
            SET estado = 'RESUELTA',
                veredicto = ?,
                fecha_hora_resolucion = now(),
                id_docente_resolucion = ?
            WHERE id_intento = ?
            """, veredictoLimpio, idDocente, idIntento);

        return new MensajeRespuesta("Incidencia resuelta correctamente");
    }
}
