
package com.lacomarcasoft.controller;

import com.lacomarcasoft.service.ConsultaPendientesServicio;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/ingresos/examenes/pendientes")
public class ConsultaPendientesControlador {

    private final ConsultaPendientesServicio servicio;

    public ConsultaPendientesControlador(
            ConsultaPendientesServicio servicio
    ) {
        this.servicio = servicio;
    }

    @GetMapping
    public List<ConsultaPendientesServicio.EstudiantePendiente> listar(
            @RequestParam(required = false) Long idExamen
    ) {
        return servicio.listar(idExamen);
    }

    @GetMapping("/{idExamen}/estudiantes/{idEstudiante}")
    public ConsultaPendientesServicio.EstudiantePendiente detalle(
            @PathVariable Long idExamen,
            @PathVariable Long idEstudiante
    ) {
        return servicio.detalle(idExamen, idEstudiante);
    }
}

