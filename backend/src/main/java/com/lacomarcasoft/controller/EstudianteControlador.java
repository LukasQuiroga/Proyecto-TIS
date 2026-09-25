package com.lacomarcasoft.controller;

import com.lacomarcasoft.dto.response.ConsultaEstudiantesRespuesta;
import com.lacomarcasoft.dto.response.EstudianteRespuesta;
import com.lacomarcasoft.service.EstudianteServicio;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/estudiantes")
public class EstudianteControlador {

    private final EstudianteServicio estudianteServicio;

    public EstudianteControlador(EstudianteServicio estudianteServicio) {
        this.estudianteServicio = estudianteServicio;
    }

    @GetMapping
    public ConsultaEstudiantesRespuesta consultar(
            @RequestParam(required = false) String busqueda,
            @RequestParam(defaultValue = "TODOS") String estado,
            @RequestParam(required = false) String carrera,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "10") int tamanio
    ) {
        return estudianteServicio.consultar(
                busqueda,
                estado,
                carrera,
                pagina,
                tamanio
        );
    }

    @GetMapping("/{idUsuario}")
    public EstudianteRespuesta buscarPorId(
            @PathVariable Long idUsuario
    ) {
        return estudianteServicio.buscarPorId(idUsuario);
    }

    @GetMapping("/carreras")
    public List<String> listarCarreras() {
        return estudianteServicio.listarCarreras();
    }
}