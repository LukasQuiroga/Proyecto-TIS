
package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.request.RegistrarSituacionExcepcionalSolicitud;
import com.lacomarcasoft.dto.response.SituacionExcepcionalResumenRespuesta;
import com.lacomarcasoft.dto.response.SituacionExcepcionalDetalleRespuesta;
import com.lacomarcasoft.modelo.Examen;
import com.lacomarcasoft.modelo.SituacionExcepcional;
import com.lacomarcasoft.modelo.Usuario;
import com.lacomarcasoft.repository.ConsultaExamenEstudianteRepositorio;
import com.lacomarcasoft.repository.ExamenRepositorio;
import com.lacomarcasoft.repository.SituacionExcepcionalRepositorio;
import com.lacomarcasoft.repository.UsuarioRepositorio;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDate;
import java.util.List;

@Service
public class SituacionExcepcionalServicio {

    private final SituacionExcepcionalRepositorio situacionRepositorio;
    private final ExamenRepositorio examenRepositorio;
    private final UsuarioRepositorio usuarioRepositorio;
    private final ConsultaExamenEstudianteRepositorio consultaExamenEstudianteRepositorio;

    public SituacionExcepcionalServicio(
            SituacionExcepcionalRepositorio situacionRepositorio,
            ExamenRepositorio examenRepositorio,
            UsuarioRepositorio usuarioRepositorio,
            ConsultaExamenEstudianteRepositorio consultaExamenEstudianteRepositorio
    ) {
        this.situacionRepositorio = situacionRepositorio;
        this.examenRepositorio = examenRepositorio;
        this.usuarioRepositorio = usuarioRepositorio;
        this.consultaExamenEstudianteRepositorio = consultaExamenEstudianteRepositorio;
    }

    @Transactional
    public Long registrar(RegistrarSituacionExcepcionalSolicitud solicitud) {

        Authentication autenticacion = SecurityContextHolder
                .getContext()
                .getAuthentication();

        if (autenticacion == null
                || !autenticacion.isAuthenticated()
                || !(autenticacion.getDetails() instanceof Long idResponsable)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Debe iniciar sesion"
            );
        }

        Usuario responsable = usuarioRepositorio.findById(idResponsable)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Usuario autenticado no encontrado"
                ));

        if (!Boolean.TRUE.equals(responsable.getActivo())
                || responsable.getRol() == null
                || !"ADMINISTRADOR".equalsIgnoreCase(
                        responsable.getRol().getNombreRol())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "No tiene permisos para registrar situaciones excepcionales"
            );
        }

        if (solicitud == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Debe proporcionar los datos de la situacion"
            );
        }

        if (solicitud.idExamen() == null || solicitud.idExamen() <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Debe seleccionar un examen valido"
            );
        }

        Examen examen = examenRepositorio.findById(solicitud.idExamen())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Examen no encontrado"
                ));

        String tipo = solicitud.tipoSituacion() == null
                ? ""
                : solicitud.tipoSituacion().trim();

        if (tipo.isEmpty() || tipo.length() > 100) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El tipo de situacion es obligatorio y debe tener hasta 100 caracteres"
            );
        }

        String descripcion = solicitud.descripcion() == null
                ? ""
                : solicitud.descripcion().trim();

        if (descripcion.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La descripcion es obligatoria"
            );
        }

        if (solicitud.fechaOcurrencia() == null
                || solicitud.horaOcurrencia() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Debe indicar la fecha y hora de la situacion"
            );
        }

        LocalDate fecha = solicitud.fechaOcurrencia();

        if (fecha.isBefore(LocalDate.of(1900, 1, 1))
                || fecha.isAfter(LocalDate.of(2100, 12, 31))) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La fecha ingresada no es valida. Introduzca una fecha entre 1900 y 2100."
            );
        }

        Usuario estudiante = null;

        if (solicitud.idEstudiante() != null) {

            if (solicitud.idEstudiante() <= 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Identificador de estudiante invalido"
                );
            }

            estudiante = usuarioRepositorio.findById(solicitud.idEstudiante())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Estudiante no encontrado"
                    ));


            if (estudiante.getRol() == null
                    || !"ESTUDIANTE".equalsIgnoreCase(
                            estudiante.getRol().getNombreRol())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "El usuario seleccionado no tiene el rol de estudiante"
                );
            }

            if (!consultaExamenEstudianteRepositorio.existeInscripcion(
                    solicitud.idExamen(),
                    solicitud.idEstudiante())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "El estudiante no esta asociado al examen seleccionado"
                );
            }
        }

        SituacionExcepcional situacion = new SituacionExcepcional();

        situacion.setExamen(examen);
        situacion.setEstudiante(estudiante);
        situacion.setRegistradoPor(responsable);
        situacion.setTipoSituacion(tipo);
        situacion.setDescripcion(descripcion);
        situacion.setFechaOcurrencia(solicitud.fechaOcurrencia());
        situacion.setHoraOcurrencia(solicitud.horaOcurrencia());

        SituacionExcepcional registrada = situacionRepositorio.save(situacion);

        return registrada.getIdSituacion();
    }

    @Transactional(readOnly = true)
    public List<SituacionExcepcionalResumenRespuesta> listarHistorial(
            Long idExamen,
            Long idEstudiante,
            String tipoSituacion
    ) {
        if (idExamen != null && idExamen <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Identificador de examen invalido"
            );
        }

        if (idEstudiante != null && idEstudiante <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Identificador de estudiante invalido"
            );
        }

        String tipoFiltrado = tipoSituacion == null
                || tipoSituacion.isBlank()
                ? null
                : tipoSituacion.trim();

        return situacionRepositorio.buscarHistorial(
                idExamen,
                idEstudiante,
                tipoFiltrado
        ).stream()
                .map(situacion -> {
                    Usuario estudiante = situacion.getEstudiante();
                    Usuario responsable = situacion.getRegistradoPor();

                    String nombreEstudiante = estudiante == null
                            ? null
                            : estudiante.getNombre() + " "
                                    + estudiante.getApellido();

                    String nombreResponsable = responsable.getNombre()
                            + " " + responsable.getApellido();

                    String evidencia = situacion.getEvidenciaReferencia();

                    return new SituacionExcepcionalResumenRespuesta(
                            situacion.getIdSituacion(),
                            situacion.getExamen().getIdExamen(),
                            situacion.getExamen().getNombreExamen(),
                            estudiante == null
                                    ? null
                                    : estudiante.getIdUsuario(),
                            nombreEstudiante,
                            situacion.getTipoSituacion(),
                            situacion.getFechaOcurrencia(),
                            situacion.getHoraOcurrencia(),
                            situacion.getFechaRegistro(),
                            evidencia != null && !evidencia.isBlank(),
                            nombreResponsable
                    );
                })
                .toList();
    }
        @Transactional(readOnly = true)
    public SituacionExcepcionalDetalleRespuesta obtenerDetalle(
            Long idSituacion
    ) {
        if (idSituacion == null || idSituacion <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Identificador de situacion invalido"
            );
        }

        SituacionExcepcional situacion = situacionRepositorio
                .buscarDetalle(idSituacion)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Situacion excepcional no encontrada"
                ));

        Usuario estudiante = situacion.getEstudiante();
        Usuario responsable = situacion.getRegistradoPor();

        String nombreEstudiante = estudiante == null
                ? null
                : estudiante.getNombre() + " " + estudiante.getApellido();

        String nombreResponsable = responsable.getNombre()
                + " " + responsable.getApellido();

        String evidencia = situacion.getEvidenciaReferencia();

        return new SituacionExcepcionalDetalleRespuesta(
                situacion.getIdSituacion(),
                situacion.getExamen().getIdExamen(),
                situacion.getExamen().getNombreExamen(),
                estudiante == null ? null : estudiante.getIdUsuario(),
                nombreEstudiante,
                situacion.getTipoSituacion(),
                situacion.getDescripcion(),
                situacion.getFechaOcurrencia(),
                situacion.getHoraOcurrencia(),
                situacion.getFechaRegistro(),
                evidencia != null && !evidencia.isBlank(),
                nombreResponsable
        );
    }
}
