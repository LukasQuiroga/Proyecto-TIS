
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

    @Transactional
    public ResultadoInscripcion inscribirEstudiante(
            String token,
            Long idEstudiante
    ) {

        if (token == null || token.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El codigo QR es obligatorio"
            );
        }

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

        String tokenHash = qrServicio.calcularHash(token);

        QrInscripcion qr = qrRepositorio.findByTokenHash(tokenHash)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "El codigo QR no es valido"
                ));

        Materia materiaQr = qr.getMateria();

        if (materiaQr == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El QR no tiene una materia asociada"
            );
        }

        Long idMateria = materiaQr.getIdMateria();

        Materia materia = materiaRepositorio.bloquearMateria(idMateria)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "La materia no existe"
                ));

        entityManager.refresh(qr);

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
                    "No se pudo registrar la inscripcion; "
                            + "verifique si ya existe",
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
}
