
package com.lacomarcasoft.controller;

import com.lacomarcasoft.dto.request.RegistrarExpulsionSolicitud;
import com.lacomarcasoft.dto.response.ExpulsionRegistradaRespuesta;
import com.lacomarcasoft.modelo.Expulsion;
import com.lacomarcasoft.service.ExpulsionServicio;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/expulsiones")
public class ExpulsionControlador {

    private final ExpulsionServicio servicio;

    public ExpulsionControlador(ExpulsionServicio servicio) {
        this.servicio = servicio;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ExpulsionRegistradaRespuesta registrar(
            @Valid @RequestBody RegistrarExpulsionSolicitud solicitud,
            Authentication auth) {

        Long idResponsable =
            auth != null && auth.getDetails() instanceof Long id
                ? id
                : null;

        Expulsion expulsion = servicio.registrar(
            solicitud,
            idResponsable
        );

        return new ExpulsionRegistradaRespuesta(
            expulsion.getIdExpulsion(),
            solicitud.idExamen(),
            solicitud.idEstudiante(),
            expulsion.getFechaHoraExpulsion(),
            expulsion.getMotivo(),
            expulsion.getObservaciones()
        );
    }
}
