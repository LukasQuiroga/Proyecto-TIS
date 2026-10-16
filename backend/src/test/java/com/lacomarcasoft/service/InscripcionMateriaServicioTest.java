
package com.lacomarcasoft.service;

import com.lacomarcasoft.modelo.Asignatura;
import com.lacomarcasoft.modelo.Materia;
import com.lacomarcasoft.modelo.MateriaEstudiante;
import com.lacomarcasoft.modelo.QrInscripcion;
import com.lacomarcasoft.modelo.Usuario;
import com.lacomarcasoft.repository.MateriaEstudianteRepositorio;
import com.lacomarcasoft.repository.MateriaRepositorio;
import com.lacomarcasoft.repository.QrInscripcionRepositorio;
import com.lacomarcasoft.repository.UsuarioRepositorio;

import jakarta.persistence.EntityManager;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class InscripcionMateriaServicioTest {

    private QrInscripcionRepositorio qrRepositorio;
    private MateriaRepositorio materiaRepositorio;
    private MateriaEstudianteRepositorio inscripcionRepositorio;
    private UsuarioRepositorio usuarioRepositorio;
    private QrInscripcionServicio qrServicio;
    private AuditoriaQrServicio auditoriaQrServicio;
    private EntityManager entityManager;

    private InscripcionMateriaServicio inscripcionServicio;

    private static final Long ID_MATERIA = 3L;
    private static final Long ID_ESTUDIANTE = 6L;
    private static final String TOKEN = "token-de-prueba";
    private static final String HASH = "hash-de-prueba";

    @BeforeEach
    void preparar() {
        qrRepositorio = mock(QrInscripcionRepositorio.class);
        materiaRepositorio = mock(MateriaRepositorio.class);
        inscripcionRepositorio =
                mock(MateriaEstudianteRepositorio.class);
        usuarioRepositorio = mock(UsuarioRepositorio.class);
        qrServicio = mock(QrInscripcionServicio.class);
        auditoriaQrServicio = mock(AuditoriaQrServicio.class);
        entityManager = mock(EntityManager.class);

        inscripcionServicio = new InscripcionMateriaServicio(
                qrRepositorio,
                materiaRepositorio,
                inscripcionRepositorio,
                usuarioRepositorio,
                qrServicio,
                entityManager,
                auditoriaQrServicio
        );
    }

    private Usuario prepararEstudiante(
            boolean activo,
            String nombreRol
    ) {
        Usuario estudiante = mock(
                Usuario.class,
                RETURNS_DEEP_STUBS
        );

        when(estudiante.getActivo()).thenReturn(activo);
        when(estudiante.getRol().getNombreRol())
                .thenReturn(nombreRol);

        when(usuarioRepositorio.findById(ID_ESTUDIANTE))
                .thenReturn(Optional.of(estudiante));

        return estudiante;
    }

    private Materia crearMateria(boolean activa) {
        Asignatura asignatura = new Asignatura();
        asignatura.setIdAsignatura(1L);
        asignatura.setNombreAsignatura(
                "Algoritmos y Programacion"
        );
        asignatura.setActivo(activa);

        Materia materia = new Materia();
        materia.setIdMateria(ID_MATERIA);
        materia.setAsignatura(asignatura);
        materia.setGrupo("B");

        return materia;
    }

    private QrInscripcion prepararQr(
            boolean asignaturaActiva,
            boolean revocado,
            OffsetDateTime expiracion
    ) {
        Materia materia = crearMateria(asignaturaActiva);

        QrInscripcion qr = new QrInscripcion();
        qr.setIdQr(10L);
        qr.setMateria(materia);
        qr.setRevocado(revocado);
        qr.setFechaExpiracion(expiracion);

        when(qrServicio.calcularHash(TOKEN))
                .thenReturn(HASH);

        when(qrRepositorio.findByTokenHash(HASH))
                .thenReturn(Optional.of(qr));

        return qr;
    }

    @Test
    void debeRechazarEstudianteInactivo() {
        prepararEstudiante(false, "ESTUDIANTE");

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> inscripcionServicio.inscribirEstudiante(
                        TOKEN,
                        ID_ESTUDIANTE
                )
        );

        assertEquals(
                HttpStatus.FORBIDDEN,
                error.getStatusCode()
        );

        verify(inscripcionRepositorio, never())
                .saveAndFlush(any(MateriaEstudiante.class));
    }

    @Test
    void debeRechazarUsuarioQueNoEsEstudiante() {
        prepararEstudiante(true, "DOCENTE");

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> inscripcionServicio.inscribirEstudiante(
                        TOKEN,
                        ID_ESTUDIANTE
                )
        );

        assertEquals(
                HttpStatus.FORBIDDEN,
                error.getStatusCode()
        );

        verify(inscripcionRepositorio, never())
                .saveAndFlush(any(MateriaEstudiante.class));
    }

    @Test
    void debeRechazarQrInvalido() {
        prepararEstudiante(true, "ESTUDIANTE");

        when(qrServicio.calcularHash(TOKEN))
                .thenReturn(HASH);

        when(qrRepositorio.findByTokenHash(HASH))
                .thenReturn(Optional.empty());

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> inscripcionServicio.inscribirEstudiante(
                        TOKEN,
                        ID_ESTUDIANTE
                )
        );

        assertEquals(
                HttpStatus.BAD_REQUEST,
                error.getStatusCode()
        );

        verify(inscripcionRepositorio, never())
                .saveAndFlush(any(MateriaEstudiante.class));
    }

    @Test
    void debeRechazarQrVencido() {
        prepararEstudiante(true, "ESTUDIANTE");

        prepararQr(
                true,
                false,
                OffsetDateTime.now().minusMinutes(5)
        );

        when(materiaRepositorio.bloquearMateria(ID_MATERIA))
                .thenReturn(
                        Optional.of(crearMateria(true))
                );

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> inscripcionServicio.inscribirEstudiante(
                        TOKEN,
                        ID_ESTUDIANTE
                )
        );

        assertEquals(
                HttpStatus.BAD_REQUEST,
                error.getStatusCode()
        );

        verify(inscripcionRepositorio, never())
                .saveAndFlush(any(MateriaEstudiante.class));
    }

    @Test
    void debeRechazarQrRevocado() {
        prepararEstudiante(true, "ESTUDIANTE");

        prepararQr(
                true,
                true,
                OffsetDateTime.now().plusMinutes(5)
        );

        when(materiaRepositorio.bloquearMateria(ID_MATERIA))
                .thenReturn(
                        Optional.of(crearMateria(true))
                );

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> inscripcionServicio.inscribirEstudiante(
                        TOKEN,
                        ID_ESTUDIANTE
                )
        );

        assertEquals(
                HttpStatus.BAD_REQUEST,
                error.getStatusCode()
        );

        verify(inscripcionRepositorio, never())
                .saveAndFlush(any(MateriaEstudiante.class));
    }

    @Test
    void debeRechazarAsignaturaInactiva() {
        prepararEstudiante(true, "ESTUDIANTE");

        prepararQr(
                false,
                false,
                OffsetDateTime.now().plusMinutes(5)
        );

        when(materiaRepositorio.bloquearMateria(ID_MATERIA))
                .thenReturn(
                        Optional.of(crearMateria(false))
                );

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> inscripcionServicio.inscribirEstudiante(
                        TOKEN,
                        ID_ESTUDIANTE
                )
        );

        assertEquals(
                HttpStatus.CONFLICT,
                error.getStatusCode()
        );

        verify(inscripcionRepositorio, never())
                .saveAndFlush(any(MateriaEstudiante.class));
    }

    @Test
    void debeRechazarInscripcionDuplicada() {
        prepararEstudiante(true, "ESTUDIANTE");

        prepararQr(
                true,
                false,
                OffsetDateTime.now().plusMinutes(5)
        );

        when(materiaRepositorio.bloquearMateria(ID_MATERIA))
                .thenReturn(
                        Optional.of(crearMateria(true))
                );

        when(inscripcionRepositorio
                .existsByMateria_IdMateriaAndEstudiante_IdUsuario(
                        ID_MATERIA,
                        ID_ESTUDIANTE
                ))
                .thenReturn(true);

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> inscripcionServicio.inscribirEstudiante(
                        TOKEN,
                        ID_ESTUDIANTE
                )
        );

        assertEquals(
                HttpStatus.CONFLICT,
                error.getStatusCode()
        );

        verify(inscripcionRepositorio, never())
                .saveAndFlush(any(MateriaEstudiante.class));
    }

    @Test
    void debeInscribirEstudianteCorrectamente() {
        prepararEstudiante(true, "ESTUDIANTE");

        prepararQr(
                true,
                false,
                OffsetDateTime.now().plusMinutes(5)
        );

        when(materiaRepositorio.bloquearMateria(ID_MATERIA))
                .thenReturn(
                        Optional.of(crearMateria(true))
                );

        when(inscripcionRepositorio
                .existsByMateria_IdMateriaAndEstudiante_IdUsuario(
                        ID_MATERIA,
                        ID_ESTUDIANTE
                ))
                .thenReturn(false);

        var resultado = inscripcionServicio.inscribirEstudiante(
                TOKEN,
                ID_ESTUDIANTE
        );

        assertEquals(ID_MATERIA, resultado.idMateria());
        assertEquals(ID_ESTUDIANTE, resultado.idEstudiante());
        assertEquals(
                "Inscripcion realizada correctamente",
                resultado.mensaje()
        );

        verify(inscripcionRepositorio)
                .saveAndFlush(any(MateriaEstudiante.class));

        verify(auditoriaQrServicio).registrarExito(
                ID_ESTUDIANTE,
                "INSCRIPCION_MEDIANTE_QR",
                ID_MATERIA
        );
    }
}
