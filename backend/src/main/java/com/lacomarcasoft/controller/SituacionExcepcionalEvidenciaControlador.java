
package com.lacomarcasoft.controller;

import com.lacomarcasoft.dto.response.MensajeRespuesta;
import com.lacomarcasoft.service.AlmacenamientoEvidenciaServicio;
import com.lacomarcasoft.service.SituacionExcepcionalEvidenciaServicio;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/situaciones-excepcionales")
public class SituacionExcepcionalEvidenciaControlador {

    private final SituacionExcepcionalEvidenciaServicio servicio;

    public SituacionExcepcionalEvidenciaControlador(
            SituacionExcepcionalEvidenciaServicio servicio
    ) {
        this.servicio = servicio;
    }

    @PostMapping(
            value = "/{idSituacion}/evidencia",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<MensajeRespuesta> adjuntar(
            @PathVariable Long idSituacion,
            @RequestParam(value = "archivo", required = false)
            MultipartFile archivo
    ) {
        servicio.adjuntar(idSituacion, archivo);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new MensajeRespuesta(
                        "Evidencia adjuntada correctamente"
                ));
    }

    @GetMapping("/{idSituacion}/evidencia")
    public ResponseEntity<Resource> descargar(
            @PathVariable Long idSituacion
    ) {
        AlmacenamientoEvidenciaServicio.Archivo archivo =
                servicio.descargar(idSituacion);

        String nombre = "evidencia-"
                + idSituacion
                + archivo.extension();

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(
                        archivo.tipoContenido()
                ))
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(nombre)
                                .build()
                                .toString()
                )
                .header("X-Content-Type-Options", "nosniff")
                .cacheControl(CacheControl.noStore())
                .body(archivo.recurso());
    }
}
