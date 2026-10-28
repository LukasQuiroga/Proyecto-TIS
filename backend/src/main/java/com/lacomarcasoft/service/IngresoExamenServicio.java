package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.response.EstadoIngresoRespuesta;
import com.lacomarcasoft.dto.response.IngresoRegistradoRespuesta;
import com.lacomarcasoft.repository.ExamenRepositorio;
import com.lacomarcasoft.repository.UsuarioRepositorio;
import com.lacomarcasoft.dto.response.ValidacionHabilitacionRespuesta;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Date;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class IngresoExamenServicio {

    private final JdbcTemplate jdbc;
    private final ExamenRepositorio examenes;
    private final UsuarioRepositorio usuarios;
    private final ValidacionHabilitacionIngresoServicio validacionHabilitacion;
    private final AccesoExamenDocenteServicio accesoExamenDocente;

    public IngresoExamenServicio(
            JdbcTemplate jdbc,
            ExamenRepositorio examenes,
            UsuarioRepositorio usuarios,
            ValidacionHabilitacionIngresoServicio validacionHabilitacion,
            AccesoExamenDocenteServicio accesoExamenDocente) {
        this.jdbc = jdbc;
        this.examenes = examenes;
        this.usuarios = usuarios;
        this.validacionHabilitacion = validacionHabilitacion;
         this.accesoExamenDocente = accesoExamenDocente;
    }

    @Transactional(readOnly = true)
    public EstadoIngresoRespuesta consultar(
            Long idExamen,
            Long idEstudiante) {

        validarIds(idExamen, idEstudiante);
        accesoExamenDocente.verificarExamenActual(idExamen);
        validarExistencia(idExamen, idEstudiante);

        return buscar(idExamen, idEstudiante);
    }

    @Transactional
    public EstadoIngresoRespuesta registrar(
            Long idExamen,
            Long idEstudiante,
            Long idResponsable) {

        validarIds(idExamen, idEstudiante);

        if (idResponsable == null || idResponsable <= 0) {
            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Debe iniciar sesion"
            );
        }
        Long idDocenteAutenticado =
            accesoExamenDocente.obtenerDocenteAutenticado();

        if (!idDocenteAutenticado.equals(idResponsable)) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "El responsable no coincide con el docente autenticado"
            );
        }
        accesoExamenDocente.verificarExamenActual(idExamen);

        validarExistencia(idExamen, idEstudiante);

        if (!usuarios.existsById(idResponsable)) {
            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Responsable no encontrado"
            );
        }

        ValidacionHabilitacionRespuesta habilitacion =
            validacionHabilitacion.validar(idExamen, idEstudiante);

        if (!habilitacion.puedeContinuar()) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                habilitacion.mensaje()
            );
        }

        int insertados = jdbc.update("""
            INSERT INTO academico.ingreso_examen
                (id_examen, id_estudiante, id_responsable)
            VALUES (?, ?, ?)
            ON CONFLICT ON CONSTRAINT uq_ingreso_examen_estudiante
            DO NOTHING
            """, idExamen, idEstudiante, idResponsable);

        if (insertados == 0) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Este estudiante ya tiene un ingreso registrado para este examen."
            );
        }

        return buscar(idExamen, idEstudiante);
    }

    private void validarIds(
            Long idExamen,
            Long idEstudiante) {

        if (idExamen == null || idExamen <= 0
                || idEstudiante == null || idEstudiante <= 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Identificadores invalidos"
            );
        }
    }

    private void validarExistencia(
            Long idExamen,
            Long idEstudiante) {

        if (!examenes.existsById(idExamen)) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Examen no encontrado"
            );
        }

        if (!usuarios.existsById(idEstudiante)) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Estudiante no encontrado"
            );
        }
    }

    private EstadoIngresoRespuesta buscar(
            Long idExamen,
            Long idEstudiante) {

        List<EstadoIngresoRespuesta> registros = jdbc.query("""
            SELECT id_ingreso, fecha_hora_ingreso, id_responsable
            FROM academico.ingreso_examen
            WHERE id_examen = ? AND id_estudiante = ?
            """,
            (rs, i) -> new EstadoIngresoRespuesta(
                idExamen,
                idEstudiante,
                true,
                rs.getLong("id_ingreso"),
                rs.getObject(
                    "fecha_hora_ingreso",
                    OffsetDateTime.class
                ),
                rs.getLong("id_responsable"),
                "Ingreso registrado"
            ),
            idExamen,
            idEstudiante
        );

        return registros.isEmpty()
            ? new EstadoIngresoRespuesta(
                idExamen,
                idEstudiante,
                false,
                null,
                null,
                null,
                "El estudiante no tiene un ingreso registrado para este examen."
            )
            : registros.get(0);
    }

    @Transactional(readOnly = true)
    public List<IngresoRegistradoRespuesta> listarRegistrados(String q, Long idExamen, String fecha) {
        StringBuilder sql = new StringBuilder("""
            SELECT 
                ie.id_ingreso,
                u.codigo_sis,
                TRIM(CONCAT(COALESCE(u.nombre, ''), ' ', COALESCE(u.apellido, ''))) AS nombre_estudiante,
                e.nombre_examen,
                COALESCE(e.aula, '') AS ambiente,
                ie.fecha_hora_ingreso,
                'Registrado' AS estado
            FROM academico.ingreso_examen ie
            JOIN academico.examen e ON e.id_examen = ie.id_examen
            JOIN seguridad.usuario u ON u.id_usuario = ie.id_estudiante
            WHERE 1=1
            """);

        List<Object> params = new ArrayList<>();

        if (q != null && !q.trim().isEmpty()) {
            String filtro = "%" + q.trim().toLowerCase() + "%";
            sql.append(" AND (LOWER(COALESCE(u.codigo_sis,'')) LIKE ? OR LOWER(TRIM(CONCAT(COALESCE(u.nombre,''), ' ', COALESCE(u.apellido,''))))) LIKE ?)");
            params.add(filtro);
            params.add(filtro);
        }

        if (idExamen != null && idExamen > 0) {
            sql.append(" AND e.id_examen = ?");
            params.add(idExamen);
        }

        if (fecha != null && !fecha.trim().isEmpty()) {
            try {
                LocalDate fechaLocal = LocalDate.parse(fecha.trim());
                sql.append(" AND DATE(ie.fecha_hora_ingreso) = ?");
                params.add(Date.valueOf(fechaLocal));
            } catch (Exception ignored) {
            }
        }

        sql.append(" ORDER BY ie.fecha_hora_ingreso DESC");

        return jdbc.query(sql.toString(),
            (rs, i) -> new IngresoRegistradoRespuesta(
                rs.getLong("id_ingreso"),
                rs.getString("codigo_sis"),
                rs.getString("nombre_estudiante"),
                rs.getString("nombre_examen"),
                rs.getString("ambiente"),
                rs.getObject("fecha_hora_ingreso", OffsetDateTime.class),
                rs.getString("estado")
            ),
            params.toArray()
        );
    }
}
