
package com.lacomarcasoft.controller;

import com.lacomarcasoft.dto.response.EstudianteExamenExpulsionRespuesta;
import com.lacomarcasoft.service.EstudiantesExamenExpulsionServicio;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/expulsiones/examenes")
public class EstudiantesExamenExpulsionControlador {

    private final EstudiantesExamenExpulsionServicio servicio;

    public EstudiantesExamenExpulsionControlador(
            EstudiantesExamenExpulsionServicio servicio) {
        this.servicio = servicio;
    }

    @GetMapping("/{idExamen}/estudiantes")
    public List<EstudianteExamenExpulsionRespuesta> listar(
            @PathVariable Long idExamen) {
        return servicio.listar(idExamen);
    }
}
