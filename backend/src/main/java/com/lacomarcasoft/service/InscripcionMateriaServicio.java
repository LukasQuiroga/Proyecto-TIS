
package com.lacomarcasoft.service;

import com.lacomarcasoft.modelo.Materia;
import com.lacomarcasoft.modelo.MateriaEstudiante;
import com.lacomarcasoft.modelo.MateriaEstudianteId;
import com.lacomarcasoft.modelo.QrInscripcion;
import com.lacomarcasoft.modelo.Usuario;

import com.lacomarcasoft.repository.MateriaEstudianteRepositorio;
import com.lacomarcasoft.repository.QrInscripcionRepositorio;
import com.lacomarcasoft.repository.UsuarioRepositorio;

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
    private final MateriaEstudianteRepositorio inscripcionRepositorio;
    private final UsuarioRepositorio usuarioRepositorio;
    private final QrInscripcionServicio qrServicio;

    public InscripcionMateriaServicio(
            QrInscripcionRepositorio qrRepositorio,
            MateriaEstudianteRepositorio inscripcionRepositorio,
            UsuarioRepositorio usuarioRepositorio,
            QrInscripcionServicio qrServicio
    ) {
        this.qrRepositorio = qrRepositorio;
        this.inscripcionRepositorio = inscripcionRepositorio;
        this.usuarioRepositorio = usuarioRepositorio;
        this.qrServicio = qrServicio;
    }

    public record ResultadoInscripcion(
            Long idMateria,
            Long idEstudiante,
            String nombreMateria,
            String grupo,
            String mensaje
    ) {}

    @Transactional
    public ResultadoInscripcion inscribirEstudiante(
            String token,
            Long idEstudiante
    ) {

        // 1. Verificar datos obligatorios
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

        // 2. Buscar estudiante
        Usuario estudiante = usuarioRepositorio.findById(idEstudiante)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Estudiante no encontrado"
                ));

        // 3. Validar usuario activo
        if (!Boolean.TRUE.equals(estudiante.getActivo())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "El usuario se encuentra inactivo"
            );
        }

        // 4. Validar rol estudiante
        if (estudiante.getRol() == null ||
                !"ESTUDIANTE".equalsIgnoreCase(
                        estudiante.getRol().getNombreRol()
                )) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Solo los estudiantes pueden inscribirse"
            );
        }

        // 5. Calcular hash del token recibido
        String tokenHash = qrServicio.calcularHash(token);

        // 6. Buscar QR registrado
        QrInscripcion qr = qrRepositorio.findByTokenHash(tokenHash)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "El codigo QR no es valido"
                ));

        // 7. Verificar si fue revocado
        if (qr.isRevocado()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El codigo QR fue revocado"
            );
        }

        // 8. Verificar fecha de vencimiento
        OffsetDateTime ahora = OffsetDateTime.now(ZoneOffset.UTC);

        if (!qr.getFechaExpiracion().isAfter(ahora)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El codigo QR ha expirado"
            );
        }

        // 9. Obtener materia asociada al QR
        Materia materia = qr.getMateria();

        if (materia == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El QR no tiene una materia asociada"
            );
        }

        Long idMateria = materia.getIdMateria();

        // 10. Verificar inscripcion duplicada
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

        // 11. Crear la inscripcion
        MateriaEstudiante inscripcion = new MateriaEstudiante();

        inscripcion.setId(
                new MateriaEstudianteId(idMateria, idEstudiante)
        );

        inscripcion.setMateria(materia);
        inscripcion.setEstudiante(estudiante);
        inscripcion.setQrInscripcion(qr);

        // 12. Guardar la inscripcion
        // saveAndFlush permite detectar conflictos de integridad
        // dentro de este metodo.
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

        // 13. Retornar confirmacion
        return new ResultadoInscripcion(
                idMateria,
                idEstudiante,
                materia.getNombreMateria(),
                materia.getGrupo(),
                "Inscripcion realizada correctamente"
        );
    }
}
