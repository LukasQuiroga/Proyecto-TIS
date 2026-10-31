package com.lacomarcasoft.controller;

import com.lacomarcasoft.dto.response.ValidacionHabilitacionRespuesta;
import com.lacomarcasoft.service.ValidacionHabilitacionIngresoServicio;
import com.lacomarcasoft.service.IntentoIngresoNoAutorizadoServicio;
import com.lacomarcasoft.service.AccesoExamenDocenteServicio;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ingresos/examenes")
public class ValidacionHabilitacionIngresoControlador {

    private final ValidacionHabilitacionIngresoServicio servicio;
    private final IntentoIngresoNoAutorizadoServicio intentos;
    private final AccesoExamenDocenteServicio acceso;

    public ValidacionHabilitacionIngresoControlador(
            ValidacionHabilitacionIngresoServicio servicio,
            IntentoIngresoNoAutorizadoServicio intentos,
            AccesoExamenDocenteServicio acceso) {
        this.servicio = servicio;
        this.intentos = intentos;
        this.acceso = acceso;
    }

    @GetMapping("/{idExamen}/estudiantes/{idEstudiante}/habilitacion")
    public ValidacionHabilitacionRespuesta validar(
            @PathVariable Long idExamen,
            @PathVariable Long idEstudiante) {

        return servicio.validar(idExamen, idEstudiante);
    }
    @PostMapping("/{idExamen}/estudiantes/{idEstudiante}/habilitacion/verificar-ingreso")
    public ValidacionHabilitacionRespuesta verificarIngreso(
            @PathVariable Long idExamen,
            @PathVariable Long idEstudiante) {

        ValidacionHabilitacionRespuesta resultado = servicio.validar(idExamen, idEstudiante);
        if (!resultado.puedeContinuar()) {
            Long responsable = acceso.obtenerDocenteAutenticado();
            intentos.registrar(idExamen, idEstudiante, responsable,
                    String.valueOf(idEstudiante), "SISTEMA", resultado.mensaje());
        }
        return resultado;
    }
}

