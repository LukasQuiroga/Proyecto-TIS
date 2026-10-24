package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.response.EstadoIngresoRespuesta;
import com.lacomarcasoft.repository.ExamenRepositorio;
import com.lacomarcasoft.repository.UsuarioRepositorio;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;

@Service
public class IngresoExamenServicio {

    private final JdbcTemplate jdbc;
    private final ExamenRepositorio examenes;
    private final UsuarioRepositorio usuarios;

    public IngresoExamenServicio(
            JdbcTemplate jdbc,
            ExamenRepositorio examenes,
            UsuarioRepositorio usuarios) {
        this.jdbc = jdbc;
        this.examenes = examenes;
        this.usuarios = usuarios;
    }

    @Transactional(readOnly = true)
    public EstadoIngresoRespuesta consultar(
            Long idExamen,
            Long idEstudiante) {

        validarIds(idExamen, idEstudiante);
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

        validarExistencia(idExamen, idEstudiante);

        if (!usuarios.existsById(idResponsable)) {
            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Responsable no encontrado"
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
}
