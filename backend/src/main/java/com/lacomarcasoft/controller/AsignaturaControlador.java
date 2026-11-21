package com.lacomarcasoft.controller;

import com.lacomarcasoft.dto.request.RegistrarAsignaturaSolicitud;
import com.lacomarcasoft.dto.response.AsignaturaRespuesta;
import com.lacomarcasoft.service.AsignaturaServicio;
import com.lacomarcasoft.service.AuditoriaAccionesServicio;
import com.lacomarcasoft.dto.response.GrupoAsignaturaRespuesta;
import com.lacomarcasoft.dto.response.DocentesPorFacultadRespuesta;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/asignaturas")
public class AsignaturaControlador {

    private final AsignaturaServicio asignaturaServicio;
    private final AuditoriaAccionesServicio auditoria;

    public AsignaturaControlador(
            AsignaturaServicio asignaturaServicio,
            AuditoriaAccionesServicio auditoria
    ) {
        this.asignaturaServicio = asignaturaServicio;
        this.auditoria = auditoria;
    }

    @PostMapping
    public ResponseEntity<AsignaturaRespuesta> registrar(
            @Valid @RequestBody RegistrarAsignaturaSolicitud solicitud,
            Authentication authentication,
            HttpServletRequest request
    ) {

        AsignaturaRespuesta respuesta =
                asignaturaServicio.registrar(solicitud);

        auditoria.registrar(
                authentication,
                request,
                "CREAR_ASIGNATURA",
                "Creación de la asignatura "
                        + (respuesta.codigoAsignatura() != null
                            ? respuesta.codigoAsignatura()
                            : respuesta.nombreAsignatura())
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(respuesta);
    }

    @GetMapping
    public ResponseEntity<List<AsignaturaRespuesta>> listar(
            @RequestParam(
                    name = "buscar",
                    required = false
            ) String buscar
    ) {

        return ResponseEntity.ok(
                asignaturaServicio.listar(buscar)
        );
    }

    @GetMapping("/docentes")
        public ResponseEntity<DocentesPorFacultadRespuesta> listarDocentes(
                @RequestParam Long idFacultad
        ) {
        return ResponseEntity.ok(
                asignaturaServicio.listarDocentesPorFacultad(idFacultad)
        );
        }

    @GetMapping("/{id}")
    public ResponseEntity<AsignaturaRespuesta> obtenerPorId(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                asignaturaServicio.obtenerPorId(id)
        );
    }

        @GetMapping("/{id}/grupos")
        public ResponseEntity<List<GrupoAsignaturaRespuesta>> listarGrupos(
                @PathVariable Long id
        ) {
        return ResponseEntity.ok(
                asignaturaServicio.listarGrupos(id)
        );
        }

}