
package com.lacomarcasoft.service;

import com.lacomarcasoft.modelo.Examen;
import com.lacomarcasoft.modelo.Usuario;
import com.lacomarcasoft.repository.ConsultaExamenEstudianteRepositorio;
import com.lacomarcasoft.repository.ExamenRepositorio;
import com.lacomarcasoft.repository.UsuarioRepositorio;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SituacionExcepcionalCatalogoServicioTest {

    private ExamenRepositorio examenRepositorio;
    private UsuarioRepositorio usuarioRepositorio;
    private ConsultaExamenEstudianteRepositorio consultaRepositorio;
    private SituacionExcepcionalCatalogoServicio servicio;

    @BeforeEach
    void preparar() {
        examenRepositorio = mock(ExamenRepositorio.class);
        usuarioRepositorio = mock(UsuarioRepositorio.class);
        consultaRepositorio = mock(
                ConsultaExamenEstudianteRepositorio.class
        );

        servicio = new SituacionExcepcionalCatalogoServicio(
                examenRepositorio,
                usuarioRepositorio,
                consultaRepositorio
        );
    }

    @Test
    void listarExamenesOrdenadosPorNombre() {
        Examen examenUno = new Examen();
        examenUno.setIdExamen(8L);
        examenUno.setNombreExamen("Segundo parcial");

        Examen examenDos = new Examen();
        examenDos.setIdExamen(9L);
        examenDos.setNombreExamen("Primer parcial");

        when(examenRepositorio.findAll())
                .thenReturn(List.of(examenUno, examenDos));

        var resultado = servicio.listarExamenes();

        assertEquals(2, resultado.size());
        assertEquals(9L, resultado.get(0).idExamen());
        assertEquals("Primer parcial", resultado.get(0).nombreExamen());
        assertEquals(8L, resultado.get(1).idExamen());
    }

    @Test
    void listarSoloEstudiantesInscritosEnExamen() {
        Usuario estudianteUno = mock(Usuario.class);
        when(estudianteUno.getIdUsuario()).thenReturn(12L);
        when(estudianteUno.getNombre()).thenReturn("Zoe");
        when(estudianteUno.getApellido()).thenReturn("Lopez");

        Usuario estudianteDos = mock(Usuario.class);
        when(estudianteDos.getIdUsuario()).thenReturn(13L);
        when(estudianteDos.getNombre()).thenReturn("Ana");
        when(estudianteDos.getApellido()).thenReturn("Perez");

        Usuario noInscrito = mock(Usuario.class);
        when(noInscrito.getIdUsuario()).thenReturn(14L);

        when(examenRepositorio.existsById(8L))
                .thenReturn(true);

        when(usuarioRepositorio.findAll())
                .thenReturn(List.of(
                        estudianteUno,
                        noInscrito,
                        estudianteDos
                ));

        when(consultaRepositorio.existeInscripcion(8L, 12L))
                .thenReturn(true);

        when(consultaRepositorio.existeInscripcion(8L, 13L))
                .thenReturn(true);

        var resultado = servicio.listarEstudiantes(8L);

        assertEquals(2, resultado.size());
        assertEquals(13L, resultado.get(0).idEstudiante());
        assertEquals("Ana Perez", resultado.get(0).nombreEstudiante());
        assertEquals(12L, resultado.get(1).idEstudiante());
        assertEquals("Zoe Lopez", resultado.get(1).nombreEstudiante());

        verify(consultaRepositorio).existeInscripcion(8L, 14L);
    }

    @Test
    void rechazaIdentificadorDeExamenInvalido() {
        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> servicio.listarEstudiantes(0L)
        );

        assertEquals(
                HttpStatus.BAD_REQUEST,
                error.getStatusCode()
        );

        verifyNoInteractions(
                examenRepositorio,
                usuarioRepositorio,
                consultaRepositorio
        );
    }

    @Test
    void devuelve404CuandoElExamenNoExiste() {
        when(examenRepositorio.existsById(99L))
                .thenReturn(false);

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> servicio.listarEstudiantes(99L)
        );

        assertEquals(
                HttpStatus.NOT_FOUND,
                error.getStatusCode()
        );

        verifyNoInteractions(
                usuarioRepositorio,
                consultaRepositorio
        );
    }
}
