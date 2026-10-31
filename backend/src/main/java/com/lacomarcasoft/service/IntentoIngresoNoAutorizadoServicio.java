package com.lacomarcasoft.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
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
                         String metodo, String motivo) {
        jdbc.update("""
            INSERT INTO academico.intento_ingreso_no_autorizado
                (id_examen, id_estudiante, id_responsable, identificador_intentado,
                 metodo_identificacion, motivo_rechazo)
            VALUES (?, ?, ?, ?, ?, ?)
            """, examen, estudiante, responsable, identificador, metodo,
            motivo == null ? "Ingreso no autorizado" : motivo.substring(0, Math.min(255, motivo.length())));
    }

    public record Intento(Long idIntento, Long idExamen, Long idEstudiante,
                          String identificadorIntentado, String nombreEstudiante,
                          String nombreExamen, String metodoIdentificacion, String motivoRechazo,
                          String responsable, OffsetDateTime fechaHora) {}

    @Transactional(readOnly = true)
    public List<Intento> listar(String q, Long idExamen, String motivo) {
        Long docente = acceso.obtenerDocenteAutenticado();
        StringBuilder sql = new StringBuilder("""
            SELECT i.id_intento, i.id_examen, i.id_estudiante, i.identificador_intentado,
                   TRIM(CONCAT(COALESCE(u.nombre, ''), ' ', COALESCE(u.apellido, ''))) AS estudiante,
                   e.nombre_examen, i.metodo_identificacion, i.motivo_rechazo,
                   TRIM(CONCAT(COALESCE(r.nombre, ''), ' ', COALESCE(r.apellido, ''))) AS responsable,
                   i.fecha_hora
            FROM academico.intento_ingreso_no_autorizado i
            JOIN academico.examen e ON e.id_examen = i.id_examen
            JOIN academico.materia m ON m.id_materia = e.id_materia
            LEFT JOIN seguridad.usuario u ON u.id_usuario = i.id_estudiante
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
            rs.getLong("id_intento"), rs.getLong("id_examen"),
            rs.getObject("id_estudiante", Long.class), rs.getString("identificador_intentado"),
            rs.getString("estudiante"), rs.getString("nombre_examen"),
            rs.getString("metodo_identificacion"), rs.getString("motivo_rechazo"),
            rs.getString("responsable"), rs.getObject("fecha_hora", OffsetDateTime.class)
        ), args.toArray());
    }
}
