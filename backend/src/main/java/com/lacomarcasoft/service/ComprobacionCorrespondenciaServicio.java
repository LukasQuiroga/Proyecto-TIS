package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.response.CorrespondenciaExamenRespuesta;
import com.lacomarcasoft.repository.ConsultaExamenEstudianteRepositorio;
import com.lacomarcasoft.repository.ExamenRepositorio;
import com.lacomarcasoft.repository.UsuarioRepositorio;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ComprobacionCorrespondenciaServicio {

    private final ConsultaExamenEstudianteRepositorio inscripciones;
    private final ExamenRepositorio examenes;
    private final UsuarioRepositorio usuarios;
    private final AccesoExamenDocenteServicio accesoExamenDocente;

    public ComprobacionCorrespondenciaServicio(
            ConsultaExamenEstudianteRepositorio inscripciones,
            ExamenRepositorio examenes,
            UsuarioRepositorio usuarios,
            AccesoExamenDocenteServicio accesoExamenDocente) {

        this.inscripciones = inscripciones;
        this.examenes = examenes;
        this.usuarios = usuarios;
        this.accesoExamenDocente = accesoExamenDocente;
    }

    @Transactional(readOnly = true)
    public CorrespondenciaExamenRespuesta comprobar(
            Long idExamen,
            Long idEstudiante) {

        if (idExamen == null || idExamen <= 0
                || idEstudiante == null || idEstudiante <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Identificadores invalidos"
            );
        }

        if (!examenes.existsById(idExamen)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "El examen seleccionado no esta disponible"
            );
        }

        accesoExamenDocente.verificarExamenActual(idExamen);

        // Verificar que el estudiante exista.
        if (!usuarios.existsById(idEstudiante)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Estudiante no encontrado"
            );
        }

        boolean corresponde = inscripciones.existeInscripcion(
                idExamen,
                idEstudiante
        );

        return new CorrespondenciaExamenRespuesta(
                idExamen,
                idEstudiante,
                corresponde,
                corresponde,
                corresponde
                        ? "Correspondencia confirmada"
                        : "El estudiante no corresponde al examen seleccionado"
        );
    }
}

