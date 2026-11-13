
package com.lacomarcasoft.controller;

import com.lacomarcasoft.dto.response.ExamenInscritoRespuesta;
import com.lacomarcasoft.service.ConsultaExamenEstudianteServicio;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/estudiante/examenes")
public class ConsultaExamenEstudianteControlador {

    private final ConsultaExamenEstudianteServicio servicio;

    public ConsultaExamenEstudianteControlador(
            ConsultaExamenEstudianteServicio servicio
    ) {
        this.servicio = servicio;
    }

    @GetMapping
    public List<ExamenInscritoRespuesta> listar(
            Authentication autenticacion
    ) {
        if (
            autenticacion == null
            || !autenticacion.isAuthenticated()
            || !(autenticacion.getDetails() instanceof Long idEstudiante)
        ) {
            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Sesion requerida"
            );
        }

        return servicio.listar(idEstudiante);
    }
}
