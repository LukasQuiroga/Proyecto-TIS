
package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.request.RegistrarExpulsionSolicitud;
import com.lacomarcasoft.modelo.Expulsion;
import com.lacomarcasoft.repository.ConsultaExamenEstudianteRepositorio;
import com.lacomarcasoft.repository.ExamenRepositorio;
import com.lacomarcasoft.repository.ExpulsionRepositorio;
import com.lacomarcasoft.repository.UsuarioRepositorio;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ExpulsionServicio {

    private final ExpulsionRepositorio expulsiones;
    private final ExamenRepositorio examenes;
    private final UsuarioRepositorio usuarios;
    private final ConsultaExamenEstudianteRepositorio inscripciones;

    public ExpulsionServicio(
            ExpulsionRepositorio expulsiones,
            ExamenRepositorio examenes,
            UsuarioRepositorio usuarios,
            ConsultaExamenEstudianteRepositorio inscripciones) {
        this.expulsiones = expulsiones;
        this.examenes = examenes;
        this.usuarios = usuarios;
        this.inscripciones = inscripciones;
    }

    @Transactional
    public Expulsion registrar(
            RegistrarExpulsionSolicitud solicitud,
            Long idResponsable) {

        if (idResponsable == null || idResponsable <= 0) {
            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Debe iniciar sesion"
            );
        }

        if (solicitud == null
                || solicitud.idExamen() == null
                || solicitud.idExamen() <= 0
                || solicitud.idEstudiante() == null
                || solicitud.idEstudiante() <= 0
                || solicitud.fechaHoraExpulsion() == null
                || solicitud.motivo() == null
                || solicitud.motivo().isBlank()
                || solicitud.motivo().length() > 200) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Datos de expulsion invalidos"
            );
        }

        Long idExamen = solicitud.idExamen();
        Long idEstudiante = solicitud.idEstudiante();

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

        if (!usuarios.existsById(idResponsable)) {
            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Responsable no encontrado"
            );
        }

        if (!inscripciones.existeInscripcion(idExamen, idEstudiante)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "El estudiante no pertenece al examen seleccionado"
            );
        }

        if (expulsiones.existsByExamen_IdExamenAndEstudiante_IdUsuario(
                idExamen, idEstudiante)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "El estudiante ya tiene una expulsion registrada para este examen"
            );
        }

        Expulsion expulsion = new Expulsion();

        expulsion.setExamen(examenes.getReferenceById(idExamen));
        expulsion.setEstudiante(usuarios.getReferenceById(idEstudiante));
        expulsion.setResponsable(usuarios.getReferenceById(idResponsable));
        expulsion.setFechaHoraExpulsion(solicitud.fechaHoraExpulsion());
        expulsion.setMotivo(solicitud.motivo().trim());

        String observaciones = solicitud.observaciones();

        expulsion.setObservaciones(
            observaciones == null || observaciones.isBlank()
                ? null
                : observaciones.trim()
        );

        return expulsiones.save(expulsion);
    }
}
