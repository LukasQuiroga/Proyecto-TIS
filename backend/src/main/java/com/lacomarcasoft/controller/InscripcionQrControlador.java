
package com.lacomarcasoft.controller;

import com.lacomarcasoft.dto.request.InscripcionQrSolicitud;
import com.lacomarcasoft.service.InscripcionMateriaServicio;
import com.lacomarcasoft.service.QrInscripcionServicio;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/inscripciones-qr")
public class InscripcionQrControlador {

    private final QrInscripcionServicio qrServicio;
    private final InscripcionMateriaServicio inscripcionServicio;

    public InscripcionQrControlador(
            QrInscripcionServicio qrServicio,
            InscripcionMateriaServicio inscripcionServicio
    ) {
        this.qrServicio = qrServicio;
        this.inscripcionServicio = inscripcionServicio;
    }

    private Long obtenerIdUsuario(Authentication authentication) {

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Debe iniciar sesion"
            );
        }

        Object detalles = authentication.getDetails();

        if (!(detalles instanceof Long)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "No se pudo identificar al usuario"
            );
        }

        return (Long) detalles;
    }

    @PostMapping("/materias/{idMateria}/generar")
    public ResponseEntity<QrInscripcionServicio.ResultadoGeneracionQr>
    generarQr(
            @PathVariable Long idMateria,
            Authentication authentication
    ) {

        Long idDocente = obtenerIdUsuario(authentication);

        var resultado = qrServicio.generarQr(
                idMateria,
                idDocente
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(resultado);
    }

    @PostMapping("/inscribir")
    public ResponseEntity<InscripcionMateriaServicio.ResultadoInscripcion>
    inscribir(
            @Valid @RequestBody InscripcionQrSolicitud solicitud,
            Authentication authentication
    ) {

        Long idEstudiante = obtenerIdUsuario(authentication);

        var resultado = inscripcionServicio.inscribirEstudiante(
                solicitud.token(),
                idEstudiante
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(resultado);
    }
}
