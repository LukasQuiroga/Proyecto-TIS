package com.lacomarcasoft.controller;

import com.lacomarcasoft.dto.request.ConfigurarExamenSolicitud;
import com.lacomarcasoft.dto.request.RegistrarExamenSolicitud;
import com.lacomarcasoft.dto.response.ExamenRespuesta;
import com.lacomarcasoft.service.ExamenServicio;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

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
            Authentication authentication,
            @RequestParam(
                    name = "buscar",
                    required = false
            ) String buscar
    ) {

        return ResponseEntity.ok(
                examenServicio.listar(buscar, idDocente(authentication))
        );
    }

    private Long idDocente(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Debe iniciar sesión"
            );
        }

        boolean administrador = authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMINISTRADOR".equals(authority.getAuthority()));
        if (administrador) {
            return null;
        }

        boolean docente = authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_DOCENTE".equals(authority.getAuthority()));
        if (docente && authentication.getDetails() instanceof Long idUsuario) {
            return idUsuario;
        }

        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "No tiene permiso para consultar estos exámenes"
        );
    }

    @GetMapping("/materias/{idMateria}/plan-de-estudios")
    public ResponseEntity<Map<String, String>> obtenerPlanEstudiosMateria(
            @PathVariable Long idMateria
    ) {

        return ResponseEntity.ok(
                Map.of(
                        "plan",
                        examenServicio.obtenerPlanEstudiosPorMateria(idMateria)
                )
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
