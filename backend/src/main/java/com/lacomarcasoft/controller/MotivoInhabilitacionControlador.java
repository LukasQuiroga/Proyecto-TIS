
package com.lacomarcasoft.controller;

import com.lacomarcasoft.modelo.MotivoInhabilitacion;
import com.lacomarcasoft.repository.MotivoInhabilitacionRepositorio;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@RestController
@RequestMapping("/api/habilitaciones/motivos")
public class MotivoInhabilitacionControlador {
    private final MotivoInhabilitacionRepositorio repositorio;

    public MotivoInhabilitacionControlador(MotivoInhabilitacionRepositorio repositorio) {
        this.repositorio = repositorio;
    }

    public record MotivoSolicitud(
        @NotBlank @Size(max = 120) String titulo,
        @NotBlank @Size(max = 500) String motivo
    ) {}

    @GetMapping
    public List<MotivoInhabilitacion> listar() {
        return repositorio.findByActivoTrueOrderByTituloAsc();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MotivoInhabilitacion registrar(@Valid @RequestBody MotivoSolicitud solicitud) {
        String titulo = solicitud.titulo().trim();
        String motivo = solicitud.motivo().trim();
        if (repositorio.existsByTituloIgnoreCase(titulo)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El titulo ya existe");
        }
        MotivoInhabilitacion entidad = new MotivoInhabilitacion();
        entidad.setTitulo(titulo);
        entidad.setMotivo(motivo);
        return repositorio.saveAndFlush(entidad);
    }
}