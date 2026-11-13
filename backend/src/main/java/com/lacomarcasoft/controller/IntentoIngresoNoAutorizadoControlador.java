package com.lacomarcasoft.controller;

import com.lacomarcasoft.service.IntentoIngresoNoAutorizadoServicio;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/ingresos/examenes/intentos-no-autorizados")
public class IntentoIngresoNoAutorizadoControlador {
    private final IntentoIngresoNoAutorizadoServicio servicio;
    public IntentoIngresoNoAutorizadoControlador(IntentoIngresoNoAutorizadoServicio servicio) {
        this.servicio = servicio;
    }
    @GetMapping
    public List<IntentoIngresoNoAutorizadoServicio.Intento> listar(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long idExamen,
            @RequestParam(required = false) String motivo) {
        return servicio.listar(q, idExamen, motivo);
    }
}
