package com.lacomarcasoft.controller;

import com.lacomarcasoft.service.PerfilFotoServicio;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/perfil/me/foto")
public class PerfilFotoControlador {

    private final PerfilFotoServicio servicio;

    public PerfilFotoControlador(PerfilFotoServicio servicio) {
        this.servicio = servicio;
    }

    @GetMapping
    public ResponseEntity<Resource> consultar(Authentication auth) {

        PerfilFotoServicio.FotoPerfil foto =
            servicio.consultar(obtenerIdUsuario(auth));

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(foto.tipoContenido()))
            .cacheControl(CacheControl.noStore())
            .body(foto.recurso());
    }

    @PutMapping(
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public Map<String, String> actualizar(
            Authentication auth,
            @RequestParam("foto") MultipartFile archivo
    ) {

        servicio.guardar(
            obtenerIdUsuario(auth),
            archivo
        );

        return Map.of(
            "message",
            "Fotografia actualizada correctamente"
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
