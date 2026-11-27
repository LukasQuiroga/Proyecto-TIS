package com.lacomarcasoft.controller;

import com.lacomarcasoft.modelo.MotivoInhabilitacion;
import com.lacomarcasoft.repository.MotivoInhabilitacionRepositorio;
import com.lacomarcasoft.service.AuditoriaAccionesServicio;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@RestController
@RequestMapping("/api/habilitaciones/motivos")
public class MotivoInhabilitacionControlador {
    private final MotivoInhabilitacionRepositorio repositorio;
    private final AuditoriaAccionesServicio auditoria;

    public MotivoInhabilitacionControlador(
            MotivoInhabilitacionRepositorio repositorio,
            AuditoriaAccionesServicio auditoria) {
        this.repositorio = repositorio;
        this.auditoria = auditoria;
    }

    public record MotivoSolicitud(
        @NotBlank @Size(max = 29, message = "El título de la inhabilitación debe contener menos de 30 caracteres.") String titulo,
        @NotBlank @Size(max = 49, message = "El motivo de inhabilitación debe contener menos de 50 caracteres.") String motivo
    ) {}

    @GetMapping
    public List<MotivoInhabilitacion> listar() {
        return repositorio.findByActivoTrueOrderByTituloAsc();
    }

    @GetMapping("/{id}")
    public MotivoInhabilitacion detalle(@PathVariable Long id) {
        return repositorio.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Motivo no encontrado"));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MotivoInhabilitacion registrar(
            @Valid @RequestBody MotivoSolicitud solicitud,
            Authentication authentication,
            HttpServletRequest request) {
        String titulo = solicitud.titulo().trim();
        if (repositorio.existsByTituloIgnoreCase(titulo)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT, "El titulo ya existe");
        }

        MotivoInhabilitacion entidad = new MotivoInhabilitacion();
        entidad.setTitulo(titulo);
        entidad.setMotivo(solicitud.motivo().trim());
        try {
            MotivoInhabilitacion guardado =
                    repositorio.saveAndFlush(entidad);

            auditoria.registrar(
                    authentication,
                    request,
                    "CREAR_MOTIVO_INHABILITACION",
                    "Creación del motivo de inhabilitación "
                            + guardado.getTitulo()
            );

            return guardado;
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT, "No se pudo registrar el motivo", ex);
        }
    }

    @PutMapping("/{id}")
    @Transactional
    public MotivoInhabilitacion modificar(@PathVariable Long id,
            @Valid @RequestBody MotivoSolicitud solicitud,
            Authentication authentication,
            HttpServletRequest request) {
        MotivoInhabilitacion entidad = repositorio.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Motivo no encontrado"));

        String titulo = solicitud.titulo().trim();
        String motivo = solicitud.motivo().trim();

        if (!entidad.getTitulo().equalsIgnoreCase(titulo)
                && repositorio.existsByTituloIgnoreCase(titulo)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT, "El titulo ya existe");
        }

        entidad.setTitulo(titulo);
        entidad.setMotivo(motivo);

        MotivoInhabilitacion guardado =
                repositorio.saveAndFlush(entidad);

        auditoria.registrar(
                authentication,
                request,
                "ACTUALIZAR_MOTIVO_INHABILITACION",
                "Actualización del motivo de inhabilitación "
                        + guardado.getTitulo()
        );

        return guardado;
    }

    @PatchMapping("/{id}/estado")
    @Transactional
    public MotivoInhabilitacion cambiarEstado(@PathVariable Long id,
            @RequestParam boolean activo,
            Authentication authentication,
            HttpServletRequest request) {
        MotivoInhabilitacion entidad = repositorio.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Motivo no encontrado"));

        entidad.setActivo(activo);

        MotivoInhabilitacion guardado =
                repositorio.saveAndFlush(entidad);

        auditoria.registrar(
                authentication,
                request,
                "CAMBIAR_ESTADO_MOTIVO_INHABILITACION",
                "El motivo de inhabilitación "
                        + guardado.getTitulo()
                        + " ahora está "
                        + (activo ? "activo" : "inactivo")
        );

        return guardado;
    }
}
