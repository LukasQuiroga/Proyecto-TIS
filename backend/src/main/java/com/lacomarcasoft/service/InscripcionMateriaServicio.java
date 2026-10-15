
package com.lacomarcasoft.service;

import com.lacomarcasoft.modelo.Materia;
import com.lacomarcasoft.modelo.MateriaEstudiante;
import com.lacomarcasoft.modelo.MateriaEstudianteId;
import com.lacomarcasoft.modelo.QrInscripcion;
import com.lacomarcasoft.modelo.Usuario;

import com.lacomarcasoft.repository.MateriaRepositorio;
import com.lacomarcasoft.repository.MateriaEstudianteRepositorio;
import com.lacomarcasoft.repository.QrInscripcionRepositorio;
import com.lacomarcasoft.repository.UsuarioRepositorio;

import jakarta.persistence.EntityManager;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.List;

@Service
public class InscripcionMateriaServicio {

    private final QrInscripcionRepositorio qrRepositorio;
    private final MateriaRepositorio materiaRepositorio;
    private final MateriaEstudianteRepositorio inscripcionRepositorio;
    private final UsuarioRepositorio usuarioRepositorio;
    private final QrInscripcionServicio qrServicio;
    private final EntityManager entityManager;

    public InscripcionMateriaServicio(
            QrInscripcionRepositorio qrRepositorio,
            MateriaRepositorio materiaRepositorio,
            MateriaEstudianteRepositorio inscripcionRepositorio,
            UsuarioRepositorio usuarioRepositorio,
            QrInscripcionServicio qrServicio,
            EntityManager entityManager
    ) {
        this.qrRepositorio = qrRepositorio;
        this.materiaRepositorio = materiaRepositorio;
        this.inscripcionRepositorio = inscripcionRepositorio;
        this.usuarioRepositorio = usuarioRepositorio;
        this.qrServicio = qrServicio;
        this.entityManager = entityManager;
    }

    public record ResultadoInscripcion(
            Long idMateria,
            Long idEstudiante,
            String nombreAsignatura,
            String grupo,
            String mensaje
    ) {}

    public record VistaPreviaInscripcion(
            Long idMateria,
            String nombreAsignatura,
            String grupo,
            OffsetDateTime fechaExpiracion,
            String estado
    ) {}

    public record EstudianteInscritoQr(
            Long idEstudiante,
            String nombre,
            String apellido,
            String correo,
            String codigoSis,
            OffsetDateTime fechaInscripcion
    ) {}

    public record MateriaInscritaEstudiante(
            Long idMateria,
            String nombreAsignatura,
            String grupo,
            OffsetDateTime fechaInscripcion
    ) {}

    private Usuario validarEstudiante(Long idEstudiante) {
        if (idEstudiante == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El estudiante es obligatorio"
            );
        }

        Usuario estudiante = usuarioRepositorio.findById(idEstudiante)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Estudiante no encontrado"
                ));

        if (!Boolean.TRUE.equals(estudiante.getActivo())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "El usuario se encuentra inactivo"
            );
        }

        if (estudiante.getRol() == null ||
                !"ESTUDIANTE".equalsIgnoreCase(
                        estudiante.getRol().getNombreRol()
                )) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Solo los estudiantes pueden inscribirse"
            );
        }

        return estudiante;
    }

    private QrInscripcion obtenerQr(
            String token,
            boolean bloquearMateria
    ) {
        if (token == null || token.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El codigo QR es obligatorio"
            );
        }

        String tokenHash = qrServicio.calcularHash(token.trim());

        QrInscripcion qr = qrRepositorio.findByTokenHash(tokenHash)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "El codigo QR no es valido"
                ));

        Materia materia = qr.getMateria();

        if (materia == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El QR no tiene una materia asociada"
            );
        }

        if (bloquearMateria) {
            materiaRepositorio.bloquearMateria(
                    materia.getIdMateria()
            ).orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "La materia no existe"
            ));

            entityManager.refresh(qr);
        }

        if (qr.isRevocado()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El codigo QR fue revocado"
            );
        }

        OffsetDateTime ahora = OffsetDateTime.now(ZoneOffset.UTC);

        if (qr.getFechaExpiracion() == null ||
                !qr.getFechaExpiracion().isAfter(ahora)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El codigo QR ha expirado"
            );
        }

        return qr;
    }

    private void validarInscripcionDuplicada(
            Long idMateria,
            Long idEstudiante
    ) {
        if (inscripcionRepositorio
                .existsByMateria_IdMateriaAndEstudiante_IdUsuario(
                        idMateria,
                        idEstudiante
                )) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "El estudiante ya esta inscrito en esta materia"
            );
        }
    }

    @Transactional(readOnly = true)
    public VistaPreviaInscripcion consultarVistaPrevia(
            String token,
            Long idEstudiante
    ) {
        validarEstudiante(idEstudiante);

        QrInscripcion qr = obtenerQr(token, false);
        Materia materia = qr.getMateria();

        validarInscripcionDuplicada(
                materia.getIdMateria(),
                idEstudiante
        );

        return new VistaPreviaInscripcion(
                materia.getIdMateria(),
                materia.getAsignatura().getNombreAsignatura(),
                materia.getGrupo(),
                qr.getFechaExpiracion(),
                "ACTIVO"
        );
    }

    @Transactional
    public ResultadoInscripcion inscribirEstudiante(
            String token,
            Long idEstudiante
    ) {
        Usuario estudiante = validarEstudiante(idEstudiante);

        QrInscripcion qr = obtenerQr(token, true);
        Materia materia = qr.getMateria();

        Long idMateria = materia.getIdMateria();

        validarInscripcionDuplicada(idMateria, idEstudiante);

        MateriaEstudiante inscripcion = new MateriaEstudiante();

        inscripcion.setId(
                new MateriaEstudianteId(idMateria, idEstudiante)
        );

        inscripcion.setMateria(materia);
        inscripcion.setEstudiante(estudiante);
        inscripcion.setQrInscripcion(qr);

        try {
            inscripcionRepositorio.saveAndFlush(inscripcion);
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No se pudo registrar la inscripcion; verifique si ya existe",
                    e
            );
        }

        return new ResultadoInscripcion(
                idMateria,
                idEstudiante,
                materia.getAsignatura().getNombreAsignatura(),
                materia.getGrupo(),
                "Inscripcion realizada correctamente"
        );
    }

    @Transactional(readOnly = true)
    public List<MateriaInscritaEstudiante> consultarMateriasInscritasEstudiante(
            Long idEstudiante
    ) {
        validarEstudiante(idEstudiante);

        return inscripcionRepositorio.findByEstudiante_IdUsuario(idEstudiante)
                .stream()
                .map(inscripcion -> {
                    Materia materia = inscripcion.getMateria();

                    return new MateriaInscritaEstudiante(
                            materia.getIdMateria(),
                            materia.getAsignatura().getNombreAsignatura(),
                            materia.getGrupo(),
                            inscripcion.getFechaInscripcion()
                    );
                })
                .sorted(
                        Comparator.comparing(
                                MateriaInscritaEstudiante::nombreAsignatura,
                                Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)
                        ).thenComparing(
                                MateriaInscritaEstudiante::grupo,
                                Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)
                        )
                )
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EstudianteInscritoQr> consultarEstudiantesInscritosQr(
            Long idMateria,
            Long idDocente
    ) {
        qrServicio.verificarAccesoDocenteMateria(
                idMateria,
                idDocente
        );

        return inscripcionRepositorio
                .findByMateria_IdMateriaAndQrInscripcionIsNotNull(
                        idMateria
                )
                .stream()
                .map(inscripcion -> {
                    Usuario estudiante = inscripcion.getEstudiante();

                    return new EstudianteInscritoQr(
                            estudiante.getIdUsuario(),
                            estudiante.getNombre(),
                            estudiante.getApellido(),
                            estudiante.getCorreo(),
                            estudiante.getCodigoSis(),
                            inscripcion.getFechaInscripcion()
                    );
                })
                .sorted(
                        Comparator
                                .comparing(
                                        EstudianteInscritoQr::apellido,
                                        Comparator.nullsLast(
                                                String.CASE_INSENSITIVE_ORDER
                                        )
                                )
                                .thenComparing(
                                        EstudianteInscritoQr::nombre,
                                        Comparator.nullsLast(
                                                String.CASE_INSENSITIVE_ORDER
                                        )
                                )
                )
                .toList();
    }
}
