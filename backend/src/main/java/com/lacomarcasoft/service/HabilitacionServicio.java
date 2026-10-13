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
import java.time.ZoneOffset;
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
            JOIN seguridad.rol r ON r.id_rol = u.id_rol
            LEFT JOIN academico.habilitacion_estudiante h
                ON h.id_examen = ? AND h.id_estudiante = me.id_estudiante
            LEFT JOIN academico.motivo_inhabilitacion mi
                ON mi.id_motivo = h.id_motivo
            WHERE me.id_materia = ? AND u.activo = TRUE
                AND UPPER(r.nombre_rol) = 'ESTUDIANTE'
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

    @Transactional(readOnly = true)
    public HabilitacionRespuesta buscar(Long examenId, Long estudianteId,
            Long responsableId) {
        return listar(examenId, responsableId).stream()
            .filter(h -> h.idEstudiante().equals(estudianteId))
            .findFirst()
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Estudiante no encontrado en este examen"));
    }

    @Transactional
    public HabilitacionRespuesta modificar(Long examenId,
            ModificarHabilitacionSolicitud solicitud, Long responsableId) {
        Examen examen = autorizado(examenId, responsableId);

        if (!"ACTIVO".equalsIgnoreCase(examen.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "El examen no esta activo");
        }

        Long estudianteId = solicitud.idEstudiante();
        Usuario estudiante = usuarios.findById(estudianteId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Estudiante no encontrado"));

        if (!Boolean.TRUE.equals(estudiante.getActivo())
                || estudiante.getRol() == null
                || !"ESTUDIANTE".equalsIgnoreCase(
                    estudiante.getRol().getNombreRol())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "El usuario no es un estudiante activo");
        }

        Integer inscrito = jdbc.queryForObject("""
            SELECT COUNT(*) FROM academico.materia_estudiante
            WHERE id_materia = ? AND id_estudiante = ?
            """, Integer.class, examen.getMateria().getIdMateria(), estudianteId);

        if (inscrito == null || inscrito == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "El estudiante no pertenece a esta materia y grupo");
        }

        String estado = solicitud.estado();
        Long motivoId = solicitud.idMotivo();

        if ("INHABILITADO".equals(estado)) {
            MotivoInhabilitacion motivo = motivos.findById(
                motivoId == null ? -1L : motivoId
            ).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Seleccione un motivo valido"));

            if (!Boolean.TRUE.equals(motivo.getActivo())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El motivo seleccionado esta inactivo");
            }
        } else if ("HABILITADO".equals(estado)) {
            if (motivoId != null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Un estudiante habilitado no puede tener motivo");
            }
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Estado de habilitacion invalido");
        }

        List<Object[]> anteriores = jdbc.query("""
            SELECT estado, id_motivo, numero_cambios
            FROM academico.habilitacion_estudiante
            WHERE id_examen = ? AND id_estudiante = ?
            """, (rs, i) -> new Object[]{
                rs.getString("estado"),
                rs.getObject("id_motivo"),
                rs.getLong("numero_cambios")
            }, examenId, estudianteId);

        if (anteriores.isEmpty() && "HABILITADO".equals(estado)
                && solicitud.numeroCambios() == 0L) {
            return buscar(examenId, estudianteId, responsableId);
        }

        jdbc.update("""
            INSERT INTO academico.examen_estudiante (id_examen, id_estudiante)
            VALUES (?, ?) ON CONFLICT DO NOTHING
            """, examenId, estudianteId);

        jdbc.update("""
            INSERT INTO academico.habilitacion_estudiante
                (id_examen, id_estudiante, estado, numero_cambios)
            VALUES (?, ?, 'HABILITADO', 0)
            ON CONFLICT DO NOTHING
            """, examenId, estudianteId);

        List<Object[]> actuales = jdbc.query("""
            SELECT estado, id_motivo, numero_cambios
            FROM academico.habilitacion_estudiante
            WHERE id_examen = ? AND id_estudiante = ?
            """, (rs, i) -> new Object[]{
                rs.getString("estado"),
                rs.getObject("id_motivo"),
                rs.getLong("numero_cambios")
            }, examenId, estudianteId);

        Object[] actual = actuales.get(0);
        long numeroActual = ((Number) actual[2]).longValue();

        if (!Objects.equals(numeroActual, solicitud.numeroCambios())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "La habilitacion fue modificada. Actualice los datos");
        }

        if (Objects.equals(actual[0], estado)
                && Objects.equals(actual[1], motivoId)) {
            return buscar(examenId, estudianteId, responsableId);
        }

        int actualizados = jdbc.update("""
            UPDATE academico.habilitacion_estudiante
            SET estado = ?, id_motivo = ?, id_usuario_responsable = ?,
                fecha_actualizacion = CURRENT_TIMESTAMP,
                numero_cambios = numero_cambios + 1
            WHERE id_examen = ? AND id_estudiante = ?
                AND numero_cambios = ?
            """, estado, motivoId, responsableId, examenId,
            estudianteId, numeroActual);

        if (actualizados != 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Otro usuario modifico esta habilitacion");
        }

        auditoria.registrar(responsableId, "MODIFICAR_HABILITACION",
            "Examen " + examenId + ", estudiante " + estudianteId
                + ": " + actual[0] + " (motivo " + actual[1]
                + ") -> " + estado + " (motivo " + motivoId + ")",
            null, true);

        return buscar(examenId, estudianteId, responsableId);
    }

    private Examen autorizado(Long examenId, Long responsableId) {
        Usuario usuario = usuarios.findById(responsableId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));

        if (!Boolean.TRUE.equals(usuario.getActivo())
                || usuario.getRol() == null
                || !"DOCENTE".equalsIgnoreCase(
                    usuario.getRol().getNombreRol())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Solo los docentes activos pueden gestionar habilitaciones");
        }

        Examen examen = examenes.findById(examenId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Examen no encontrado"));

        if (examen.getMateria() == null
                || examen.getMateria().getDocente() == null
                || !responsableId.equals(
                    examen.getMateria().getDocente().getIdUsuario())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "No eres el docente encargado de esta materia y grupo");
        }

        return examen;
    }

    private OffsetDateTime leerFecha(Timestamp fecha) {
        return fecha == null ? null :
            fecha.toInstant().atOffset(ZoneOffset.UTC);
    }
}
