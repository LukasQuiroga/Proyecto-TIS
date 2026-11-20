package com.lacomarcasoft.controller;

import com.lacomarcasoft.dto.request.ResolverIncidenciaSolicitud;
import com.lacomarcasoft.dto.response.MensajeRespuesta;
import com.lacomarcasoft.service.IntentoFotoServicio;
import com.lacomarcasoft.service.IntentoIngresoNoAutorizadoServicio;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/ingresos/examenes/intentos-no-autorizados")
public class IntentoIngresoNoAutorizadoControlador {
    private final IntentoIngresoNoAutorizadoServicio servicio;
    private final IntentoFotoServicio intentoFoto;

    public IntentoIngresoNoAutorizadoControlador(
            IntentoIngresoNoAutorizadoServicio servicio,
            IntentoFotoServicio intentoFoto) {
        this.servicio = servicio;
        this.intentoFoto = intentoFoto;
    }

    @GetMapping
    public List<IntentoIngresoNoAutorizadoServicio.Intento> listar(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long idExamen,
            @RequestParam(required = false) String motivo) {
        return servicio.listar(q, idExamen, motivo);
    }

    @GetMapping("/{idIntento}")
    public IntentoIngresoNoAutorizadoServicio.Intento detalle(
            @PathVariable Long idIntento) {
        return servicio.detalle(idIntento);
    }

    @GetMapping("/{idIntento}/foto")
    public ResponseEntity<Resource> foto(
            @PathVariable Long idIntento) {
        IntentoIngresoNoAutorizadoServicio.Intento intento =
            servicio.detalle(idIntento);

        if (intento.fotoReferencia() == null
                || intento.fotoReferencia().isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "La incidencia no tiene fotografia registrada"
            );
        }

        IntentoFotoServicio.FotoEvidencia foto =
            intentoFoto.consultar(intento.fotoReferencia());

        return ResponseEntity.ok()
            .contentType(
                MediaType.parseMediaType(foto.tipoContenido())
            )
            .cacheControl(CacheControl.noStore())
            .body(foto.recurso());
    }

    @PutMapping("/{idIntento}/resolver")
    public MensajeRespuesta resolver(
            @PathVariable Long idIntento,
            @RequestBody ResolverIncidenciaSolicitud solicitud) {
        return servicio.resolver(idIntento, solicitud.veredicto());
    }
}
