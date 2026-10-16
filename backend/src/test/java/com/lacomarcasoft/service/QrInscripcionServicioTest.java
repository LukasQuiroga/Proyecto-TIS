
package com.lacomarcasoft.service;

import com.lacomarcasoft.modelo.Asignatura;
import com.lacomarcasoft.modelo.Materia;
import com.lacomarcasoft.modelo.QrInscripcion;
import com.lacomarcasoft.modelo.Usuario;
import com.lacomarcasoft.repository.MateriaRepositorio;
import com.lacomarcasoft.repository.QrInscripcionRepositorio;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class QrInscripcionServicioTest {

    private QrInscripcionRepositorio qrRepositorio;
    private MateriaRepositorio materiaRepositorio;
    private QrInscripcionServicio qrServicio;

    @BeforeEach
    void preparar() {
        qrRepositorio = mock(QrInscripcionRepositorio.class);
        materiaRepositorio = mock(MateriaRepositorio.class);

        QrTokenCifradoServicio cifradoServicio =
                mock(QrTokenCifradoServicio.class);

        AuditoriaQrServicio auditoriaQrServicio =
                mock(AuditoriaQrServicio.class);

        qrServicio = new QrInscripcionServicio(
                qrRepositorio,
                materiaRepositorio,
                cifradoServicio,
                auditoriaQrServicio
        );
    }

    private Materia crearMateria(boolean asignaturaActiva) {
        Usuario docente = mock(Usuario.class);

        when(docente.getIdUsuario()).thenReturn(3L);
        when(docente.getActivo()).thenReturn(true);

        Asignatura asignatura = new Asignatura();
        asignatura.setIdAsignatura(1L);
        asignatura.setNombreAsignatura("Algoritmos y Programacion");
        asignatura.setActivo(asignaturaActiva);

        Materia materia = new Materia();
        materia.setIdMateria(3L);
        materia.setDocente(docente);
        materia.setAsignatura(asignatura);
        materia.setGrupo("B");

        return materia;
    }

    @Test
    void debeRechazarGeneracionParaAsignaturaInactiva() {
        Materia materia = crearMateria(false);

        when(materiaRepositorio.bloquearMateria(3L))
                .thenReturn(Optional.of(materia));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> qrServicio.generarQr(3L, 3L)
        );

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());

        verify(qrRepositorio, never()).save(any(QrInscripcion.class));
    }

    @Test
    void debeRechazarGeneracionCuandoExisteQrActivo() {
        Materia materia = crearMateria(true);

        QrInscripcion qrActivo = new QrInscripcion();
        qrActivo.setMateria(materia);
        qrActivo.setRevocado(false);
        qrActivo.setFechaExpiracion(
                OffsetDateTime.now().plusMinutes(5)
        );

        when(materiaRepositorio.bloquearMateria(3L))
                .thenReturn(Optional.of(materia));

        when(qrRepositorio.findByMateria_IdMateriaOrderByFechaCreacionDesc(3L))
                .thenReturn(List.of(qrActivo));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> qrServicio.generarQr(3L, 3L)
        );

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());

        verify(qrRepositorio, never()).save(any(QrInscripcion.class));
    }

    @Test
    void debeRechazarDocenteNoAutorizado() {
        Materia materia = crearMateria(true);

        when(materiaRepositorio.bloquearMateria(3L))
                .thenReturn(Optional.of(materia));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> qrServicio.generarQr(3L, 99L)
        );

        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());

        verify(qrRepositorio, never()).save(any(QrInscripcion.class));
    }

    @Test
    void debeRechazarDesactivacionSinQrActivo() {
        Materia materia = crearMateria(true);

        when(materiaRepositorio.bloquearMateria(3L))
                .thenReturn(Optional.of(materia));

        when(qrRepositorio.findByMateria_IdMateriaOrderByFechaCreacionDesc(3L))
                .thenReturn(List.of());

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> qrServicio.desactivarQr(3L, 3L)
        );

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());

        verify(qrRepositorio, never()).saveAllAndFlush(any());
    }
}
