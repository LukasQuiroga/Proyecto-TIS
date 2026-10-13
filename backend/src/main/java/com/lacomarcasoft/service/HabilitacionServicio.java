
package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.request.ModificarHabilitacionSolicitud;
import com.lacomarcasoft.dto.response.HabilitacionRespuesta;
import com.lacomarcasoft.modelo.Examen;
import com.lacomarcasoft.modelo.MotivoInhabilitacion;
import com.lacomarcasoft.modelo.Usuario;
import com.lacomarcasoft.repository.ExamenRepositorio;
import com.lacomarcasoft.repository.MotivoInhabilitacionRepositorio;
import com.lacomarcasoft.repository.UsuarioRepositorio;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Objects;

@Service
public class HabilitacionServicio {
    private final JdbcTemplate jdbc;
    private final ExamenRepositorio examenes;
    private final UsuarioRepositorio usuarios;
    private final MotivoInhabilitacionRepositorio motivos;
    private final LogActividadServicio auditoria;

    public HabilitacionServicio(JdbcTemplate jdbc, ExamenRepositorio examenes,
            UsuarioRepositorio usuarios, MotivoInhabilitacionRepositorio motivos,
            LogActividadServicio auditoria) {
        this.jdbc = jdbc;
        this.examenes = examenes;
        this.usuarios = usuarios;
        this.motivos = motivos;
        this.auditoria = auditoria;
    }

    @Transactional(readOnly = true)
    public List<HabilitacionRespuesta> listar(Long examenId, Long responsableId) {
        Examen examen = autorizado(examenId, responsableId);
        return jdbc.query("""
            SELECT me.id_estudiante, u.codigo_sis, u.nombre, u.apellido,
                   COALESCE(h.estado, 'HABILITADO') AS estado,
                   h.id_motivo, mi.titulo, mi.motivo, h.fecha_creacion,
                   h.fecha_actualizacion, h.id_usuario_responsable,
                   COALESCE(h.numero_cambios, 0) AS numero_cambios
            FROM academico.materia_estudiante me
            JOIN seguridad.usuario u ON u.id_usuario = me.id_estudiante
            LEFT JOIN academico.habilitacion_estudiante h
                ON h.id_examen = ? AND h.id_estudiante = me.id_estudiante
            LEFT JOIN academico.motivo_inhabilitacion mi ON mi.id_motivo = h.id_motivo
            WHERE me.id_materia = ? AND u.activo = TRUE
            ORDER BY u.apellido, u.nombre
            """, (rs, i) -> new HabilitacionRespuesta(
                examenId, examen.getNombreExamen(), rs.getLong("id_estudiante"),
                rs.getString("codigo_sis"),
                rs.getString("nombre") + " " + rs.getString("apellido"),
                rs.getString("estado"), (Long) rs.getObject("id_motivo"),
                rs.getString("titulo"), rs.getString("motivo"),
                leerFecha(rs.getTimestamp("fecha_creacion")),
                leerFecha(rs.getTimestamp("fecha_actualizacion")),
                (Long) rs.getObject("id_usuario_responsable"),
                rs.getLong("numero_cambios")
            ), examenId, examen.getMateria().getIdMateria());
    }

    @Transactional
    public HabilitacionRespuesta modificar(Long examenId, ModificarHabilitacionSolicitud solicitud,
            Long responsableId) {
        Examen examen = autorizado(examenId, responsableId);
        Long estudianteId = solicitud.idEstudiante();
        if (estudianteId == null || !usuarios.existsById(estudianteId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Estudiante no encontrado");
        }
        Integer inscrito = jdbc.queryForObject("""
            SELECT COUNT(*) FROM academico.materia_estudiante
            WHERE id_materia = ? AND id_estudiante = ?
            """, Integer.class, examen.getMateria().getIdMateria(), estudianteId);
        if (inscrito == null || inscrito == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El estudiante no esta inscrito en la materia del examen");
        }
        Long motivoId = solicitud.idMotivo();
        if ("INHABILITADO".equals(solicitud.estado())) {
            MotivoInhabilitacion motivo = motivos.findById(Objects.requireNonNullElse(motivoId, -1L))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe seleccionar un motivo valido"));
            if (!Boolean.TRUE.equals(motivo.getActivo())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El motivo esta inactivo");
            }
        } else if ("HABILITADO".equals(solicitud.estado())) {
            if (motivoId != null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Un estudiante habilitado no puede tener motivo");
            }
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado invalido");
        }

        jdbc.update("""
            INSERT INTO academico.examen_estudiante (id_examen, id_estudiante)
            VALUES (?, ?) ON CONFLICT DO NOTHING
            """, examenId, estudianteId);
        jdbc.update("""
            INSERT INTO academico.habilitacion_estudiante
                (id_examen, id_estudiante, estado, numero_cambios)
            VALUES (?, ?, 'HABILITADO', 0) ON CONFLICT DO NOTHING
            """, examenId, estudianteId);

        List<Object[]> anterior = jdbc.query("""
            SELECT estado, id_motivo, numero_cambios
            FROM academico.habilitacion_estudiante
            WHERE id_examen = ? AND id_estudiante = ?
            """, (rs, i) -> new Object[]{rs.getString(1), rs.getObject(2), rs.getLong(3)}, examenId, estudianteId);
        Object[] actual = anterior.get(0);
        if (!Objects.equals(((Number) actual[2]).longValue(), solicitud.numeroCambios())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La habilitacion fue modificada por otro usuario");
        }
        if (Objects.equals(actual[0], solicitud.estado()) && Objects.equals(actual[1], motivoId)) {
            return buscar(examenId, estudianteId, responsableId);
        }
        int cambios = jdbc.update("""
            UPDATE academico.habilitacion_estudiante
            SET estado = ?, id_motivo = ?, id_usuario_responsable = ?,
                fecha_actualizacion = CURRENT_TIMESTAMP, numero_cambios = numero_cambios + 1
            WHERE id_examen = ? AND id_estudiante = ? AND numero_cambios = ?
            """, solicitud.estado(), motivoId, responsableId, examenId, estudianteId, solicitud.numeroCambios());
        if (cambios != 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La habilitacion cambio; actualice los datos");
        }
        auditoria.registrar(responsableId, "MODIFICAR_HABILITACION",
            "Examen " + examenId + ", estudiante " + estudianteId + ": " + actual[0] + " (motivo " + actual[1]
                + ") -> " + solicitud.estado() + " (motivo " + motivoId + ")", null, true);
        return buscar(examenId, estudianteId, responsableId);
    }

    @Transactional(readOnly = true)
    public HabilitacionRespuesta buscar(Long examenId, Long estudianteId, Long responsableId) {
        return listar(examenId, responsableId).stream()
            .filter(h -> h.idEstudiante().equals(estudianteId))
            .findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Estudiante no encontrado en el examen"));
    }

    
    private Examen autorizado(Long examenId, Long responsableId) {
        Usuario usuario = usuarios.findById(responsableId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));

        if (!Boolean.TRUE.equals(usuario.getActivo())) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN, "Usuario inactivo");
        }

        if (!"DOCENTE".equalsIgnoreCase(usuario.getRol().getNombreRol())) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN, "Solo los docentes pueden gestionar habilitaciones");
        }

        Examen examen = examenes.findById(examenId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Examen no encontrado"));

        if (examen.getMateria() == null ||
            examen.getMateria().getDocente() == null ||
            !responsableId.equals(
                examen.getMateria().getDocente().getIdUsuario())) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "No eres el docente encargado de esta materia y grupo");
        }

        return examen;
    }

    private OffsetDateTime leerFecha(Timestamp fecha) {
        return fecha == null ? null : fecha.toInstant().atOffset(java.time.ZoneOffset.UTC);
    }
}