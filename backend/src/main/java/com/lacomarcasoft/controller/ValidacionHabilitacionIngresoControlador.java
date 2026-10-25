package com.lacomarcasoft.controller;

import com.lacomarcasoft.dto.response.ValidacionHabilitacionRespuesta;
import com.lacomarcasoft.service.ValidacionHabilitacionIngresoServicio;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ingresos/examenes")
public class ValidacionHabilitacionIngresoControlador {

    private final ValidacionHabilitacionIngresoServicio servicio;

    public ValidacionHabilitacionIngresoControlador(
            ValidacionHabilitacionIngresoServicio servicio) {
        this.servicio = servicio;
    }

    @GetMapping("/{idExamen}/estudiantes/{idEstudiante}/habilitacion")
    public ValidacionHabilitacionRespuesta validar(
            @PathVariable Long idExamen,
            @PathVariable Long idEstudiante) {

        return servicio.validar(idExamen, idEstudiante);
    }
}

