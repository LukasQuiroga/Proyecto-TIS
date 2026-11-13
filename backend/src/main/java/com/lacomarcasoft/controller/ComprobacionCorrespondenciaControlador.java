package com.lacomarcasoft.controller;

import com.lacomarcasoft.dto.response.CorrespondenciaExamenRespuesta;
import com.lacomarcasoft.service.ComprobacionCorrespondenciaServicio;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ingresos/examenes")
public class ComprobacionCorrespondenciaControlador {

    private final ComprobacionCorrespondenciaServicio servicio;

    public ComprobacionCorrespondenciaControlador(
            ComprobacionCorrespondenciaServicio servicio) {
        this.servicio = servicio;
    }

    @GetMapping(
        "/{idExamen}/estudiantes/{idEstudiante}/correspondencia"
    )
    public CorrespondenciaExamenRespuesta comprobar(
            @PathVariable Long idExamen,
            @PathVariable Long idEstudiante) {

        return servicio.comprobar(idExamen, idEstudiante);
    }
}

