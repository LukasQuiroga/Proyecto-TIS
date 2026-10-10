package com.lacomarcasoft.controller;

import com.lacomarcasoft.dto.request.RegistrarAsignaturaSolicitud;
import com.lacomarcasoft.dto.response.AsignaturaRespuesta;
import com.lacomarcasoft.service.AsignaturaServicio;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/asignaturas")
public class AsignaturaControlador {

    private final AsignaturaServicio asignaturaServicio;

    public AsignaturaControlador(
            AsignaturaServicio asignaturaServicio
    ) {
        this.asignaturaServicio = asignaturaServicio;
    }

    @PostMapping
    public ResponseEntity<AsignaturaRespuesta> registrar(
            @Valid @RequestBody RegistrarAsignaturaSolicitud solicitud
    ) {

        AsignaturaRespuesta respuesta =
                asignaturaServicio.registrar(solicitud);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(respuesta);
    }
}