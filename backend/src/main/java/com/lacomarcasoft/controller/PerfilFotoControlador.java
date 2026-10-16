
package com.lacomarcasoft.controller;

import com.lacomarcasoft.service.PerfilFotoServicio;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/perfil/me/foto")
public class PerfilFotoControlador {

    private static final Logger log =
        LoggerFactory.getLogger(PerfilFotoControlador.class);

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

    @PutMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> actualizar(
            Authentication auth,
            @RequestParam("foto") MultipartFile archivo
    ) {
        Long idUsuario = obtenerIdUsuario(auth);

        log.info(
            "HU13: subida de fotografia. Usuario={}, tamaño={}, MIME={}",
            idUsuario,
            archivo.getSize(),
            archivo.getContentType()
        );

        try {
            servicio.guardar(idUsuario, archivo);

            log.info(
                "HU13: fotografia guardada correctamente. Usuario={}",
                idUsuario
            );

            return Map.of(
                "message",
                "Fotografia actualizada correctamente"
            );

        } catch (ResponseStatusException ex) {
            log.warn(
                "HU13: fotografia rechazada. Usuario={}, HTTP={}, motivo={}",
                idUsuario,
                ex.getStatusCode().value(),
                ex.getReason()
            );

            throw ex;
        }
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
