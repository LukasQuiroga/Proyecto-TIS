package com.lacomarcasoft.controller;

import com.lacomarcasoft.dto.request.ActualizarAmbienteSolicitud;
import com.lacomarcasoft.dto.request.RegistrarAmbienteSolicitud;
import com.lacomarcasoft.dto.response.AmbienteRespuesta;
import com.lacomarcasoft.dto.response.DisponibilidadAmbienteRespuesta;
import com.lacomarcasoft.service.AmbienteServicio;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/ambientes")
public class AmbienteControlador {

    private final AmbienteServicio ambienteServicio;

    public AmbienteControlador(
            AmbienteServicio ambienteServicio
    ) {
        this.ambienteServicio = ambienteServicio;
    }

    @PostMapping
    public ResponseEntity<AmbienteRespuesta> registrar(
            @Valid
            @RequestBody RegistrarAmbienteSolicitud solicitud
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        ambienteServicio.registrar(solicitud)
                );
    }

    @GetMapping
    public ResponseEntity<List<AmbienteRespuesta>> listar(
            @RequestParam(
                    name = "buscar",
                    required = false
            ) String buscar,

            @RequestParam(
                    name = "disponible",
                    required = false
            ) Boolean disponible
    ) {
        return ResponseEntity.ok(
                ambienteServicio.listar(
                        buscar,
                        disponible
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<AmbienteRespuesta> obtenerPorId(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                ambienteServicio.obtenerPorId(id)
        );
    }

    @GetMapping("/{id}/disponibilidad")
    public ResponseEntity<DisponibilidadAmbienteRespuesta>
    verificarDisponibilidad(
            @PathVariable Long id,
            @RequestParam LocalDate fecha,
            @RequestParam LocalTime horaInicio,
            @RequestParam LocalTime horaFin,
            @RequestParam(
                    name = "idExamenExcluir",
                    required = false
            ) Long idExamenExcluir
    ) {
        return ResponseEntity.ok(
                ambienteServicio.verificarDisponibilidad(
                        id,
                        fecha,
                        horaInicio,
                        horaFin,
                        idExamenExcluir
                )
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<AmbienteRespuesta> actualizar(
            @PathVariable Long id,
            @Valid
            @RequestBody ActualizarAmbienteSolicitud solicitud
    ) {
        return ResponseEntity.ok(
                ambienteServicio.actualizar(
                        id,
                        solicitud
                )
        );
    }
}