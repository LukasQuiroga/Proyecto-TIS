package com.lacomarcasoft.controller;

import com.lacomarcasoft.dto.request.RegistrarIngresoSolicitud;
import com.lacomarcasoft.dto.response.EstadoIngresoRespuesta;
import com.lacomarcasoft.service.IngresoExamenServicio;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/ingresos/examenes")
public class IngresoExamenControlador {

    private final IngresoExamenServicio servicio;

    public IngresoExamenControlador(
            IngresoExamenServicio servicio) {
        this.servicio = servicio;
    }

    @GetMapping("/{idExamen}/estudiantes/{idEstudiante}")
    public EstadoIngresoRespuesta consultar(
            @PathVariable Long idExamen,
            @PathVariable Long idEstudiante) {

        return servicio.consultar(idExamen, idEstudiante);
    }

    @PostMapping("/{idExamen}/ingresos")
    @ResponseStatus(HttpStatus.CREATED)
    public EstadoIngresoRespuesta registrar(
            @PathVariable Long idExamen,
            @Valid @RequestBody RegistrarIngresoSolicitud solicitud,
            Authentication auth) {

        Long responsable =
            auth != null && auth.getDetails() instanceof Long id
                ? id
                : null;

        return servicio.registrar(
            idExamen,
            solicitud.idEstudiante(),
            responsable
        );
    }

    @ExceptionHandler(ResponseStatusException.class)
    public org.springframework.http.ResponseEntity<Map<String, String>> error(
            ResponseStatusException ex) {

        return org.springframework.http.ResponseEntity
            .status(ex.getStatusCode())
            .body(Map.of(
                "mensaje",
                ex.getReason() == null
                    ? "No se pudo procesar el ingreso"
                    : ex.getReason()
            ));
    }
}
