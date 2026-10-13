package com.lacomarcasoft.controller;

import com.lacomarcasoft.dto.request.ConfigurarExamenSolicitud;
import com.lacomarcasoft.dto.request.RegistrarExamenSolicitud;
import com.lacomarcasoft.dto.response.ExamenRespuesta;
import com.lacomarcasoft.service.ExamenServicio;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/examenes")
public class ExamenControlador {

    private final ExamenServicio examenServicio;

    public ExamenControlador(ExamenServicio examenServicio) {
        this.examenServicio = examenServicio;
    }

    @PostMapping
    public ResponseEntity<ExamenRespuesta> registrar(
            @Valid @RequestBody RegistrarExamenSolicitud solicitud
    ) {

        ExamenRespuesta respuesta =
                examenServicio.registrar(solicitud);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(respuesta);
    }

    @GetMapping
    public ResponseEntity<List<ExamenRespuesta>> listar(
            @RequestParam(
                    name = "buscar",
                    required = false
            ) String buscar
    ) {

        return ResponseEntity.ok(
                examenServicio.listar(buscar)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExamenRespuesta> obtenerPorId(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                examenServicio.obtenerPorId(id)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExamenRespuesta> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody RegistrarExamenSolicitud solicitud
    ) {

        return ResponseEntity.ok(
                examenServicio.actualizar(id, solicitud)
        );
    }


@PutMapping("/{id}/configuracion")
public ResponseEntity<ExamenRespuesta> configurar(
        @PathVariable Long id,
        @Valid @RequestBody ConfigurarExamenSolicitud solicitud
) {

        return ResponseEntity.ok(
                examenServicio.configurar(id, solicitud)
        );
}

}
