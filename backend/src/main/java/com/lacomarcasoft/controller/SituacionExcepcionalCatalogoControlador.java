
package com.lacomarcasoft.controller;

import com.lacomarcasoft.service.SituacionExcepcionalCatalogoServicio;
import com.lacomarcasoft.service.SituacionExcepcionalCatalogoServicio.EstudianteOpcion;
import com.lacomarcasoft.service.SituacionExcepcionalCatalogoServicio.ExamenOpcion;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/situaciones-excepcionales/catalogo")
public class SituacionExcepcionalCatalogoControlador {

    private final SituacionExcepcionalCatalogoServicio servicio;

    public SituacionExcepcionalCatalogoControlador(
            SituacionExcepcionalCatalogoServicio servicio
    ) {
        this.servicio = servicio;
    }

    @GetMapping("/examenes")
    public List<ExamenOpcion> listarExamenes() {
        return servicio.listarExamenes();
    }

    @GetMapping("/examenes/{idExamen}/estudiantes")
    public List<EstudianteOpcion> listarEstudiantes(
            @PathVariable Long idExamen
    ) {
        return servicio.listarEstudiantes(idExamen);
    }
}
