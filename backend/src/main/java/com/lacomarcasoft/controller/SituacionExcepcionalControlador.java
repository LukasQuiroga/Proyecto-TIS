
package com.lacomarcasoft.controller;

import com.lacomarcasoft.dto.request.RegistrarSituacionExcepcionalSolicitud;
import com.lacomarcasoft.service.SituacionExcepcionalServicio;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/situaciones-excepcionales")
public class SituacionExcepcionalControlador {

    private final SituacionExcepcionalServicio servicio;

    public SituacionExcepcionalControlador(
            SituacionExcepcionalServicio servicio
    ) {
        this.servicio = servicio;
    }

    @PostMapping
    public ResponseEntity<RegistroRespuesta> registrar(
            @RequestBody RegistrarSituacionExcepcionalSolicitud solicitud
    ) {
        Long idSituacion = servicio.registrar(solicitud);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new RegistroRespuesta(
                        idSituacion,
                        "Situacion excepcional registrada correctamente"
                ));
    }

    public record RegistroRespuesta(
            Long idSituacion,
            String mensaje
    ) {
    }
}
