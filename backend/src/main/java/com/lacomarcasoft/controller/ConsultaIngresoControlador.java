package com.lacomarcasoft.controller;

import com.lacomarcasoft.service.ConsultaIngresoServicio;
import org.springframework.web.bind.annotation.*;
import com.lacomarcasoft.service.PerfilFotoServicio;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.util.List;

@RestController
@RequestMapping("/api/ingresos/examenes")
public class ConsultaIngresoControlador {

    private final ConsultaIngresoServicio servicio;
    private final PerfilFotoServicio fotoServicio;

    public ConsultaIngresoControlador(
            ConsultaIngresoServicio servicio, PerfilFotoServicio fotoServicio) {
        this.servicio = servicio;
        this.fotoServicio = fotoServicio;
    }

    @GetMapping("/disponibles")
    public List<ConsultaIngresoServicio.ExamenDisponible>
            listarExamenes() {
        return servicio.listarExamenes();
    }

    @GetMapping("/{idExamen}/estudiantes")
    public List<ConsultaIngresoServicio.EstudianteDisponible>
            listarEstudiantes(@PathVariable Long idExamen) {
        return servicio.listarEstudiantes(idExamen);
    }

    @GetMapping("/{idExamen}/identificar-documento")
    public ConsultaIngresoServicio.EstudianteIdentificado
            identificarPorDocumento(
                    @PathVariable Long idExamen,
                    @RequestParam String documento) {

        return servicio.identificarPorDocumento(
            idExamen,
            documento
        );
    }
    @GetMapping("/{idExamen}/identificar-codigo")
    public ConsultaIngresoServicio.EstudianteIdentificado identificarPorCodigo(
            @PathVariable Long idExamen,
            @RequestParam String codigo) {
        return servicio.identificarPorCodigo(idExamen, codigo);
    }

    @GetMapping("/{idExamen}/estudiantes/{idEstudiante}/foto")
    public ResponseEntity<Resource> fotoEstudiante(
            @PathVariable Long idExamen,
            @PathVariable Long idEstudiante) {
        servicio.comprobarAccesoFoto(idExamen, idEstudiante);
        PerfilFotoServicio.FotoPerfil foto = fotoServicio.consultar(idEstudiante);
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(foto.tipoContenido()))
            .cacheControl(CacheControl.noStore())
            .body(foto.recurso());
    }

}