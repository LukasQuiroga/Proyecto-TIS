package com.lacomarcasoft.controller;

import com.lacomarcasoft.dto.request.InscripcionQrSolicitud;
import com.lacomarcasoft.modelo.Usuario;
import com.lacomarcasoft.repository.MateriaRepositorio;
import com.lacomarcasoft.repository.UsuarioRepositorio;
import com.lacomarcasoft.service.InscripcionMateriaServicio;
import com.lacomarcasoft.service.QrInscripcionServicio;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/inscripciones-qr")
public class InscripcionQrControlador {

    private final QrInscripcionServicio qrServicio;
    private final InscripcionMateriaServicio inscripcionServicio;
    private final MateriaRepositorio materiaRepositorio;
    private final UsuarioRepositorio usuarioRepositorio;

    public InscripcionQrControlador(
            QrInscripcionServicio qrServicio,
            InscripcionMateriaServicio inscripcionServicio,
            MateriaRepositorio materiaRepositorio,
            UsuarioRepositorio usuarioRepositorio
    ) {
        this.qrServicio = qrServicio;
        this.inscripcionServicio = inscripcionServicio;
        this.materiaRepositorio = materiaRepositorio;
        this.usuarioRepositorio = usuarioRepositorio;
    }

    private Long obtenerIdUsuario(Authentication authentication) {

        if (authentication == null ||
                !authentication.isAuthenticated()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Debe iniciar sesion"
            );
        }

        Object detalles = authentication.getDetails();

        if (!(detalles instanceof Long)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "No se pudo identificar al usuario"
            );
        }

        return (Long) detalles;
    }

    public record MateriaDocenteRespuesta(
            Long idMateria,
            String nombreAsignatura,
            String grupo
    ) {}

    @GetMapping("/materias/docente")
    public ResponseEntity<List<MateriaDocenteRespuesta>>
    obtenerMateriasDocente(Authentication authentication) {

        Long idDocente = obtenerIdUsuario(authentication);

        Usuario docente = usuarioRepositorio.findById(idDocente)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Usuario no encontrado"
                ));

        if (!Boolean.TRUE.equals(docente.getActivo())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "El usuario se encuentra inactivo"
            );
        }

        if (docente.getRol() == null ||
                !"DOCENTE".equalsIgnoreCase(
                        docente.getRol().getNombreRol()
                )) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Solo los docentes pueden consultar sus materias"
            );
        }

        List<MateriaDocenteRespuesta> materias =
                materiaRepositorio
                        .listarPorDocente(idDocente)
                        .stream()
                        .map(materia -> new MateriaDocenteRespuesta(
                                materia.getIdMateria(),
                                materia.getAsignatura().getNombreAsignatura(),
                                materia.getGrupo()
                        ))
                        .toList();

        return ResponseEntity.ok(materias);
    }

    @GetMapping("/materias/estudiante")
    public ResponseEntity<List<InscripcionMateriaServicio.MateriaInscritaEstudiante>>
    consultarMateriasInscritasEstudiante(Authentication authentication) {
        Long idEstudiante = obtenerIdUsuario(authentication);

        var materias = inscripcionServicio.consultarMateriasInscritasEstudiante(
                idEstudiante
        );

        return ResponseEntity.ok(materias);
    }

    @GetMapping("/materias/{idMateria}/activo")
    public ResponseEntity<QrInscripcionServicio.ResultadoConsultaQr>
    consultarQrActivo(
            @PathVariable Long idMateria,
            Authentication authentication
    ) {
        Long idDocente = obtenerIdUsuario(authentication);

        var resultado = qrServicio.consultarQrActivo(
                idMateria,
                idDocente
        );

        if (resultado == null) {
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok(resultado);
    }

    @GetMapping("/materias/{idMateria}/estudiantes")
    public ResponseEntity<List<InscripcionMateriaServicio.EstudianteInscritoQr>>
    consultarEstudiantesInscritos(
            @PathVariable Long idMateria,
            Authentication authentication
    ) {
        Long idDocente = obtenerIdUsuario(authentication);

        var estudiantes = inscripcionServicio.consultarEstudiantesInscritosQr(
                idMateria,
                idDocente
        );

        return ResponseEntity.ok(estudiantes);
    }

    @PostMapping("/materias/{idMateria}/generar")
    public ResponseEntity<QrInscripcionServicio.ResultadoGeneracionQr>
    generarQr(
            @PathVariable Long idMateria,
            Authentication authentication
    ) {
        Long idDocente = obtenerIdUsuario(authentication);

        var resultado = qrServicio.generarQr(
                idMateria,
                idDocente
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(resultado);
    }

    @PostMapping("/materias/{idMateria}/renovar")
    public ResponseEntity<QrInscripcionServicio.ResultadoGeneracionQr>
    renovarQr(
            @PathVariable Long idMateria,
            Authentication authentication
    ) {
        Long idDocente = obtenerIdUsuario(authentication);

        var resultado = qrServicio.renovarQr(
                idMateria,
                idDocente
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(resultado);
    }

    @PatchMapping("/materias/{idMateria}/desactivar")
    public ResponseEntity<QrInscripcionServicio.ResultadoEstadoQr>
    desactivarQr(
            @PathVariable Long idMateria,
            Authentication authentication
    ) {
        Long idDocente = obtenerIdUsuario(authentication);

        var resultado = qrServicio.desactivarQr(
                idMateria,
                idDocente
        );

        return ResponseEntity.ok(resultado);
    }

    @PostMapping("/validar")
    public ResponseEntity<InscripcionMateriaServicio.VistaPreviaInscripcion>
    validarQr(
            @Valid @RequestBody InscripcionQrSolicitud solicitud,
            Authentication authentication
    ) {
        Long idEstudiante = obtenerIdUsuario(authentication);

        var resultado = inscripcionServicio.consultarVistaPrevia(
                solicitud.token(),
                idEstudiante
        );

        return ResponseEntity.ok(resultado);
    }

    @PostMapping("/inscribir")
    public ResponseEntity<InscripcionMateriaServicio.ResultadoInscripcion>
    inscribir(
            @Valid @RequestBody InscripcionQrSolicitud solicitud,
            Authentication authentication
    ) {
        Long idEstudiante = obtenerIdUsuario(authentication);

        var resultado = inscripcionServicio.inscribirEstudiante(
                solicitud.token(),
                idEstudiante
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(resultado);
    }
}
