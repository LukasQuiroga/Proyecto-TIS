package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.request.ModificarHabilitacionSolicitud;
import com.lacomarcasoft.dto.response.HabilitacionRespuesta;
import com.lacomarcasoft.dto.response.HistorialHabilitacionRespuesta;
import com.lacomarcasoft.modelo.Examen;
import com.lacomarcasoft.modelo.Usuario;
import com.lacomarcasoft.repository.ExamenRepositorio;
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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class HabilitacionServicio {
    private final JdbcTemplate jdbc;
    private final ExamenRepositorio examenes;
    private final UsuarioRepositorio usuarios;
    private final LogActividadServicio auditoria;

    public HabilitacionServicio(JdbcTemplate jdbc, ExamenRepositorio examenes,
            UsuarioRepositorio usuarios,
            LogActividadServicio auditoria) {
        this.jdbc = jdbc;
        this.examenes = examenes;
        this.usuarios = usuarios;
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
                rs.getString("estado"), rs.getObject("id_motivo", Long.class),
                rs.getString("titulo"), rs.getString("motivo"),
                leerFecha(rs.getTimestamp("fecha_creacion")),
                leerFecha(rs.getTimestamp("fecha_actualizacion")),
                rs.getObject("id_usuario_responsable", Long.class),
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
        String titulo = solicitud.titulo() == null ? "" : solicitud.titulo().trim();
        String textoMotivo = solicitud.motivo() == null ? "" : solicitud.motivo().trim();

        if ("INHABILITADO".equals(estado)) {
            if (titulo.isEmpty() || textoMotivo.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Debe escribir el titulo y el motivo de inhabilitacion");
            }
            if (titulo.length() > 120 || textoMotivo.length() > 500) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El titulo o motivo supera el limite permitido");
            }
        } else if (!"HABILITADO".equals(estado)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Estado de habilitacion invalido");
        }

        List<Object[]> anteriores = jdbc.query("""
            SELECT estado, id_motivo, numero_cambios
            FROM academico.habilitacion_estudiante
            WHERE id_examen = ? AND id_estudiante = ?
            """, (rs, i) -> new Object[]{
                rs.getString("estado"),
                rs.getObject("id_motivo", Long.class),
                rs.getLong("numero_cambios")
            }, examenId, estudianteId);

        if (anteriores.isEmpty()) {
            if (solicitud.numeroCambios() != 0L) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La habilitacion fue modificada. Actualice los datos");
            }

            if ("HABILITADO".equals(estado)) {
                return buscar(examenId, estudianteId, responsableId);
            }
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
                rs.getObject("id_motivo", Long.class),
                rs.getLong("numero_cambios")
            }, examenId, estudianteId);

        if (actuales.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "No se pudo preparar la habilitacion");
        }

        Object[] actual = actuales.get(0);
        long numeroActual = ((Number) actual[2]).longValue();

        if (!Objects.equals(numeroActual, solicitud.numeroCambios())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "La habilitacion fue modificada. Actualice los datos");
        }

        Long motivoId = null;
        if ("INHABILITADO".equals(estado)) {
            motivoId = obtenerOCrearMotivo(titulo, textoMotivo);
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
                + ": " + actual[0] + " -> " + estado
                + ". Motivo anterior: " + describirMotivo((Long) actual[1])
                + ". Motivo nuevo: " + describirMotivo(motivoId),
            null, true);

        return buscar(examenId, estudianteId, responsableId);
    }

    @Transactional(readOnly = true)
    public List<HistorialHabilitacionRespuesta> historial(
            Long examenId, Long estudianteId, Long responsableId) {
        autorizado(examenId, responsableId);
        buscar(examenId, estudianteId, responsableId);

        String identificador = "Examen " + examenId
            + ", estudiante " + estudianteId + ":";

        return jdbc.query("""
            SELECT l.id_log, l.id_usuario, u.nombre, u.apellido,
                   l.descripcion, l.fecha
            FROM seguridad.log_actividad l
            LEFT JOIN seguridad.usuario u
                ON u.id_usuario = l.id_usuario
            WHERE l.tipo_accion = 'MODIFICAR_HABILITACION'
                AND l.exitosa = TRUE
                AND LEFT(l.descripcion, LENGTH(?)) = ?
            ORDER BY l.fecha DESC, l.id_log DESC
            LIMIT 200
            """, (rs, i) -> {
                String nombre = rs.getString("nombre");
                String apellido = rs.getString("apellido");
                String responsable = nombre == null
                    ? "Usuario desconocido"
                    : nombre + " " + (apellido == null ? "" : apellido);

                return new HistorialHabilitacionRespuesta(
                    rs.getLong("id_log"),
                    rs.getObject("id_usuario", Long.class),
                    responsable.trim(),
                    enriquecerDescripcionHistorial(rs.getString("descripcion")),
                    leerFecha(rs.getTimestamp("fecha"))
                );
            }, identificador, identificador);
    }

    private String describirMotivo(Long idMotivo) {
        if (idMotivo == null) {
            return "Sin motivo";
        }
        List<String> datos = jdbc.query("""
            SELECT titulo, motivo FROM academico.motivo_inhabilitacion
            WHERE id_motivo = ?
            """, (rs, i) -> "Titulo: " + rs.getString("titulo")
                + "; Descripcion: " + rs.getString("motivo"), idMotivo);
        return datos.isEmpty() ? "Motivo #" + idMotivo + " (no disponible)"
            : datos.get(0).replaceAll("[\r\n]+", " ");
    }

    private String enriquecerDescripcionHistorial(String descripcion) {
        if (descripcion == null) {
            return "Sin descripcion";
        }
        Pattern patron = Pattern.compile(
            "^(Examen \\d+, estudiante \\d+: )"
                + "(HABILITADO|INHABILITADO) \\(motivo (null|\\d+)\\)"
                + " -> (HABILITADO|INHABILITADO) \\(motivo (null|\\d+)\\)$"
        );
        Matcher coincidencia = patron.matcher(descripcion);
        if (!coincidencia.matches()) {
            return descripcion;
        }
        Long anterior = "null".equals(coincidencia.group(3))
            ? null : Long.valueOf(coincidencia.group(3));
        Long nuevo = "null".equals(coincidencia.group(5))
            ? null : Long.valueOf(coincidencia.group(5));
        return coincidencia.group(1) + coincidencia.group(2)
            + " -> " + coincidencia.group(4)
            + ". Motivo anterior: " + describirMotivo(anterior)
            + ". Motivo nuevo: " + describirMotivo(nuevo);
    }

    private Long obtenerOCrearMotivo(String titulo, String texto) {
        List<Long> existentes = jdbc.query("""
            SELECT id_motivo FROM academico.motivo_inhabilitacion
            WHERE LOWER(TRIM(titulo)) = LOWER(TRIM(?))
            """, (rs, i) -> rs.getLong(1), titulo);
        if (existentes.isEmpty()) {
            jdbc.update("""
                INSERT INTO academico.motivo_inhabilitacion (titulo, motivo)
                VALUES (?, ?) ON CONFLICT DO NOTHING
                """, titulo, texto);
        }
        return jdbc.query("""
            SELECT id_motivo, motivo FROM academico.motivo_inhabilitacion
            WHERE LOWER(TRIM(titulo)) = LOWER(TRIM(?))
            """, rs -> {
                if (!rs.next()) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "No se pudo registrar el motivo");
                }
                if (!texto.equals(rs.getString("motivo"))) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Ya existe ese titulo con otro motivo. Utilice otro titulo");
                }
                return rs.getLong("id_motivo");
            }, titulo);
    }

    @Transactional(readOnly = true)
    public Long buscarIdPorCodigo(String codigo, Long responsableId) {
        if (codigo == null || codigo.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Debe ingresar el codigo del examen");
        }

        List<Long> ids = jdbc.queryForList("""
            SELECT id_examen
            FROM academico.examen
            WHERE UPPER(TRIM(codigo)) = UPPER(TRIM(?))
            LIMIT 2
            """, Long.class, codigo.trim());

        if (ids.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Codigo de examen no encontrado");
        }
        if (ids.size() > 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Existe mas de un examen con ese codigo");
        }

        autorizado(ids.get(0), responsableId);
        return ids.get(0);
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
        return fecha == null ? null
            : fecha.toInstant().atOffset(ZoneOffset.UTC);
    }
}
