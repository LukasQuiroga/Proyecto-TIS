package com.lacomarcasoft.controller;

import com.lacomarcasoft.dto.request.ActualizarTelefonoPerfilSolicitud;
import com.lacomarcasoft.dto.request.ActualizarDocumentoPerfilSolicitud;
import com.lacomarcasoft.dto.request.CambiarContrasenaPerfilSolicitud;
import com.lacomarcasoft.dto.response.PerfilRespuesta;
import com.lacomarcasoft.service.AuditoriaAccionesServicio;
import com.lacomarcasoft.service.PerfilServicio;

import jakarta.servlet.http.HttpServletRequest;
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
    private final AuditoriaAccionesServicio auditoria;

    public PerfilControlador(
            PerfilServicio servicio,
            AuditoriaAccionesServicio auditoria
    ) {
        this.servicio = servicio;
        this.auditoria = auditoria;
    }

    @GetMapping("/me")
    public PerfilRespuesta consultar(Authentication auth) {
        return servicio.consultar(obtenerIdUsuario(auth));
    }

    @PatchMapping("/me/telefono")
    public PerfilRespuesta actualizarTelefono(
            Authentication auth,
            @Valid @RequestBody ActualizarTelefonoPerfilSolicitud solicitud,
            HttpServletRequest request
    ) {
        PerfilRespuesta respuesta = servicio.actualizarTelefono(
            obtenerIdUsuario(auth),
            solicitud
        );

        auditoria.registrar(
            auth,
            request,
            "ACTUALIZAR_TELEFONO_PERFIL",
            "El usuario actualizó su número de teléfono"
        );

        return respuesta;
    }

    @PatchMapping("/me/documento")
    public PerfilRespuesta actualizarDocumento(
            Authentication auth,
            @Valid @RequestBody ActualizarDocumentoPerfilSolicitud solicitud,
            HttpServletRequest request
    ) {
        PerfilRespuesta respuesta =
                servicio.actualizarDocumento(obtenerIdUsuario(auth), solicitud);

        auditoria.registrar(
            auth,
            request,
            "ACTUALIZAR_DOCUMENTO_PERFIL",
            "El usuario actualizó su documento de identidad"
        );

        return respuesta;
    }

    @PutMapping("/me/contrasena")
    public Map<String, String> cambiarContrasena(
            Authentication auth,
            @Valid @RequestBody CambiarContrasenaPerfilSolicitud solicitud,
            HttpServletRequest request
    ) {
        servicio.cambiarContrasena(
            obtenerIdUsuario(auth),
            solicitud
        );

        auditoria.registrar(
            auth,
            request,
            "ACTUALIZAR_CONTRASENA",
            "El usuario actualizó su contraseña"
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
