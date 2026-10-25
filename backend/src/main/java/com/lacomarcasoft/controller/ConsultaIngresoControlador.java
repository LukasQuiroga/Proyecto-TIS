package com.lacomarcasoft.controller;

import com.lacomarcasoft.service.ConsultaIngresoServicio;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ingresos/examenes")
public class ConsultaIngresoControlador {

    private final ConsultaIngresoServicio servicio;

    public ConsultaIngresoControlador(ConsultaIngresoServicio servicio) {
        this.servicio = servicio;
    }

    @GetMapping("/disponibles")
    public List<ConsultaIngresoServicio.ExamenDisponible> listarExamenes() {
        return servicio.listarExamenes();
    }

    @GetMapping("/{idExamen}/estudiantes")
    public List<ConsultaIngresoServicio.EstudianteDisponible> listarEstudiantes(
            @PathVariable Long idExamen) {
        return servicio.listarEstudiantes(idExamen);
    }
}

