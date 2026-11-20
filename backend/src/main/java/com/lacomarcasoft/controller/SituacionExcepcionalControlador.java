
package com.lacomarcasoft.controller;

import com.lacomarcasoft.dto.request.RegistrarSituacionExcepcionalSolicitud;
import com.lacomarcasoft.dto.response.SituacionExcepcionalResumenRespuesta;
import com.lacomarcasoft.dto.response.SituacionExcepcionalDetalleRespuesta;
import org.springframework.web.bind.annotation.PathVariable;
import com.lacomarcasoft.service.SituacionExcepcionalServicio;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import java.util.List;

@RestController
@RequestMapping("/api/situaciones-excepcionales")
public class SituacionExcepcionalControlador {

    private final SituacionExcepcionalServicio servicio;

    public SituacionExcepcionalControlador(
            SituacionExcepcionalServicio servicio
    ) {
        this.servicio = servicio;
    }

    @PostMapping
    public ResponseEntity<RegistroRespuesta> registrar(
            @RequestBody RegistrarSituacionExcepcionalSolicitud solicitud
    ) {
        Long idSituacion = servicio.registrar(solicitud);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new RegistroRespuesta(
                        idSituacion,
                        "Situacion excepcional registrada correctamente"
                ));
    }

    @GetMapping
    public List<SituacionExcepcionalResumenRespuesta> listarHistorial(
            @RequestParam(required = false) Long idExamen,
            @RequestParam(required = false) Long idEstudiante,
            @RequestParam(required = false) String tipoSituacion
    ) {
        return servicio.listarHistorial(
                idExamen,
                idEstudiante,
                tipoSituacion
        );
    }
    public record RegistroRespuesta(
            Long idSituacion,
            String mensaje
    ) {
    }

    @GetMapping("/{idSituacion}")
    public SituacionExcepcionalDetalleRespuesta obtenerDetalle(
            @PathVariable Long idSituacion
    ) {
        return servicio.obtenerDetalle(idSituacion);
    }
}
