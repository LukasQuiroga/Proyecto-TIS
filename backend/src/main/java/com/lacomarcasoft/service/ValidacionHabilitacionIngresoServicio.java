package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.response.ValidacionHabilitacionRespuesta;
import com.lacomarcasoft.repository.ExamenRepositorio;
import com.lacomarcasoft.repository.UsuarioRepositorio;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ValidacionHabilitacionIngresoServicio {

    private final JdbcTemplate jdbc;
    private final ExamenRepositorio examenes;
    private final UsuarioRepositorio usuarios;
    private final AccesoExamenDocenteServicio accesoExamenDocente;

    public ValidacionHabilitacionIngresoServicio(
            JdbcTemplate jdbc,
            ExamenRepositorio examenes,
            UsuarioRepositorio usuarios,
            AccesoExamenDocenteServicio accesoExamenDocente) {
        this.jdbc = jdbc;
        this.examenes = examenes;
        this.usuarios = usuarios;
        this.accesoExamenDocente = accesoExamenDocente;
    }

    @Transactional(readOnly = true)
    public ValidacionHabilitacionRespuesta validar(
            Long idExamen,
            Long idEstudiante) {

        if (idExamen == null || idExamen <= 0
                || idEstudiante == null || idEstudiante <= 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Identificadores invalidos"
            );
        }
        accesoExamenDocente.verificarExamenActual(idExamen);

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

        List<ValidacionHabilitacionRespuesta> resultados = jdbc.query("""
            SELECT
                COALESCE(h.estado, 'HABILITADO') AS estado,
                COALESCE(
                    h.titulo_motivo_personalizado,
                    mi.titulo
                ) AS titulo_motivo,
                COALESCE(
                    h.motivo_personalizado,
                    mi.motivo
                ) AS motivo
            FROM academico.examen e
            JOIN academico.materia_estudiante me
                ON me.id_materia = e.id_materia
                AND me.id_estudiante = ?
            LEFT JOIN academico.habilitacion_estudiante h
                ON h.id_examen = e.id_examen
                AND h.id_estudiante = me.id_estudiante
            LEFT JOIN academico.motivo_inhabilitacion mi
                ON mi.id_motivo = h.id_motivo
            WHERE e.id_examen = ?
            """,
            (rs, fila) -> {
                String estado = rs.getString("estado");

                if ("INHABILITADO".equals(estado)) {
                    return new ValidacionHabilitacionRespuesta(
                        idExamen,
                        idEstudiante,
                        estado,
                        false,
                        rs.getString("titulo_motivo"),
                        rs.getString("motivo"),
                        "Estudiante inhabilitado para este examen"
                    );
                }

                if ("HABILITADO".equals(estado) || estado == null) {
                    return new ValidacionHabilitacionRespuesta(
                        idExamen,
                        idEstudiante,
                        estado == null ? "HABILITADO" : estado,
                        true,
                        null,
                        null,
                        "Estudiante habilitado para este examen"
                    );
                }

                return new ValidacionHabilitacionRespuesta(
                    idExamen,
                    idEstudiante,
                    "SIN_ESTADO",
                    false,
                    null,
                    null,
                    "El estudiante no tiene una habilitacion definida para este examen"
                );
            },
            idEstudiante,
            idExamen
        );

        if (resultados.isEmpty()) {
            return new ValidacionHabilitacionRespuesta(
                idExamen,
                idEstudiante,
                "NO_ASOCIADO",
                false,
                null,
                null,
                "El estudiante no esta inscrito en la materia del examen"
            );
        }

        return resultados.get(0);
    }
}
