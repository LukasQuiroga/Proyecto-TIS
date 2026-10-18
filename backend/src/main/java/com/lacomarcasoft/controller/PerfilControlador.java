package com.lacomarcasoft.controller;

import com.lacomarcasoft.dto.request.ActualizarTelefonoPerfilSolicitud;
import com.lacomarcasoft.dto.request.CambiarContrasenaPerfilSolicitud;
import com.lacomarcasoft.dto.response.PerfilRespuesta;
import com.lacomarcasoft.service.PerfilServicio;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/perfil")
public class PerfilControlador {

    private final PerfilServicio servicio;

    public PerfilControlador(PerfilServicio servicio) {
        this.servicio = servicio;
    }

    @GetMapping("/me")
    public PerfilRespuesta consultar(Authentication auth) {
        return servicio.consultar(obtenerIdUsuario(auth));
    }

    @PatchMapping("/me/telefono")
    public PerfilRespuesta actualizarTelefono(
            Authentication auth,
            @Valid @RequestBody ActualizarTelefonoPerfilSolicitud solicitud
    ) {
        return servicio.actualizarTelefono(
            obtenerIdUsuario(auth),
            solicitud
        );
    }

    @PutMapping("/me/contrasena")
    public Map<String, String> cambiarContrasena(
            Authentication auth,
            @Valid @RequestBody CambiarContrasenaPerfilSolicitud solicitud
    ) {
        servicio.cambiarContrasena(
            obtenerIdUsuario(auth),
            solicitud
        );

        return Map.of(
            "message",
            "Contrasena actualizada correctamente"
        );
    }

    private Long obtenerIdUsuario(Authentication auth) {
        if (auth == null
                || !auth.isAuthenticated()
                || !(auth.getDetails() instanceof Long idUsuario)) {
            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Debe iniciar sesion"
            );
        }

        return idUsuario;
    }
}
