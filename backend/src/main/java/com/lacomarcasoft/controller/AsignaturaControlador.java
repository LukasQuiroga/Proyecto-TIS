package com.lacomarcasoft.controller;

import com.lacomarcasoft.dto.request.RegistrarAsignaturaSolicitud;
import com.lacomarcasoft.dto.response.AsignaturaRespuesta;
import com.lacomarcasoft.service.AsignaturaServicio;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

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

    @GetMapping
    public ResponseEntity<List<AsignaturaRespuesta>> listar(
            @RequestParam(
                    name = "buscar",
                    required = false
            ) String buscar
    ) {

        return ResponseEntity.ok(
                asignaturaServicio.listar(buscar)
        );
    }


    @GetMapping("/{id}")
    public ResponseEntity<AsignaturaRespuesta> obtenerPorId(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                asignaturaServicio.obtenerPorId(id)
        );
    }
}