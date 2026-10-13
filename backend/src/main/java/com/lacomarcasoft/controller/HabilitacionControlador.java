
package com.lacomarcasoft.controller;

import com.lacomarcasoft.dto.request.ModificarHabilitacionSolicitud;
import com.lacomarcasoft.dto.response.HabilitacionRespuesta;
import com.lacomarcasoft.service.HabilitacionServicio;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@RestController
@RequestMapping("/api/habilitaciones")
public class HabilitacionControlador {
    private final HabilitacionServicio servicio;

    public HabilitacionControlador(HabilitacionServicio servicio) {
        this.servicio = servicio;
    }

    @GetMapping("/examenes/{idExamen}")
    public List<HabilitacionRespuesta> listar(@PathVariable Long idExamen, Authentication auth) {
        return servicio.listar(idExamen, usuario(auth));
    }

    @GetMapping("/examenes/{idExamen}/estudiantes/{idEstudiante}")
    public HabilitacionRespuesta detalle(@PathVariable Long idExamen,
            @PathVariable Long idEstudiante, Authentication auth) {
        return servicio.buscar(idExamen, idEstudiante, usuario(auth));
    }

    @PutMapping("/examenes/{idExamen}")
    public HabilitacionRespuesta modificar(@PathVariable Long idExamen,
            @Valid @RequestBody ModificarHabilitacionSolicitud solicitud, Authentication auth) {
        return servicio.modificar(idExamen, solicitud, usuario(auth));
    }

    private Long usuario(Authentication auth) {
        if (auth == null || !(auth.getDetails() instanceof Long id)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Inicie sesion");
        }
        return id;
    }
}