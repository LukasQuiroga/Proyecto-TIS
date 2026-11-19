
package com.lacomarcasoft.service;

import com.lacomarcasoft.modelo.Expulsion;
import com.lacomarcasoft.modelo.Usuario;
import com.lacomarcasoft.repository.ExamenRepositorio;
import com.lacomarcasoft.repository.ExpulsionRepositorio;
import com.lacomarcasoft.repository.UsuarioRepositorio;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class EstudiantesExamenExpulsionServicioTest {

    private JdbcTemplate jdbc;
    private ExamenRepositorio examenes;
    private UsuarioRepositorio usuarios;
    private ExpulsionRepositorio expulsiones;
    private EstudiantesExamenExpulsionServicio servicio;

    @BeforeEach
    void preparar() {
        jdbc = mock(JdbcTemplate.class);
        examenes = mock(ExamenRepositorio.class);
        usuarios = mock(UsuarioRepositorio.class);
        expulsiones = mock(ExpulsionRepositorio.class);

        servicio = new EstudiantesExamenExpulsionServicio(
            jdbc,
            examenes,
            usuarios,
            expulsiones
        );
    }

    @Test
    void rechazaIdentificadorInvalido() {
        ResponseStatusException error = assertThrows(
            ResponseStatusException.class,
            () -> servicio.listar(0L)
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());

        verifyNoInteractions(jdbc, examenes, usuarios, expulsiones);
    }

    @Test
    void rechazaExamenInexistente() {
        when(examenes.existsById(12L)).thenReturn(false);

        ResponseStatusException error = assertThrows(
            ResponseStatusException.class,
            () -> servicio.listar(12L)
        );

        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());

        verifyNoInteractions(jdbc, usuarios, expulsiones);
    }

    @Test
    void devuelveListaVaciaCuandoNoHayInscritos() {
        when(examenes.existsById(12L)).thenReturn(true);

        when(jdbc.queryForList(
            anyString(),
            eq(Long.class),
            eq(12L)
        )).thenReturn(List.of());

        var resultado = servicio.listar(12L);

        assertTrue(resultado.isEmpty());

        verifyNoInteractions(usuarios, expulsiones);
    }

    @Test
    void distingueEstudiantesConExpulsionRegistrada() {
        when(examenes.existsById(12L)).thenReturn(true);

        when(jdbc.queryForList(
            anyString(),
            eq(Long.class),
            eq(12L)
        )).thenReturn(List.of(45L, 52L));

        Usuario ana = mock(Usuario.class);
        Usuario carlos = mock(Usuario.class);

        when(ana.getIdUsuario()).thenReturn(45L);
        when(ana.getNombre()).thenReturn("Ana");
        when(ana.getApellido()).thenReturn("Perez");

        when(carlos.getIdUsuario()).thenReturn(52L);
        when(carlos.getNombre()).thenReturn("Carlos");
        when(carlos.getApellido()).thenReturn("Lopez");

        when(usuarios.findAllById(List.of(45L, 52L)))
            .thenReturn(List.of(ana, carlos));

        Expulsion expulsion = mock(Expulsion.class);

        when(expulsion.getEstudiante()).thenReturn(carlos);

        when(expulsiones.findByExamen_IdExamenOrderByFechaHoraExpulsionDesc(12L))
            .thenReturn(List.of(expulsion));

        var resultado = servicio.listar(12L);

        assertEquals(2, resultado.size());

        assertEquals(45L, resultado.get(0).idEstudiante());
        assertEquals("Ana Perez", resultado.get(0).nombreCompleto());
        assertFalse(resultado.get(0).expulsado());

        assertEquals(52L, resultado.get(1).idEstudiante());
        assertEquals("Carlos Lopez", resultado.get(1).nombreCompleto());
        assertTrue(resultado.get(1).expulsado());
    }
}
