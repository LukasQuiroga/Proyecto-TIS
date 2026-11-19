
package com.lacomarcasoft.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ConsultaPendientesServicioTest {

    private JdbcTemplate jdbc;
    private ConsultaPendientesServicio servicio;

    @BeforeEach
    void preparar() {
        jdbc = mock(JdbcTemplate.class);
        servicio = new ConsultaPendientesServicio(jdbc);
    }

    @Test
    void rechazaExamenInvalido() {
        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> servicio.listar(0L)
        );

        assertEquals(
                HttpStatus.BAD_REQUEST,
                error.getStatusCode()
        );

        verifyNoInteractions(jdbc);
    }

    @Test
    void rechazaExamenInexistente() {
        when(jdbc.queryForObject(
                anyString(),
                eq(Boolean.class),
                eq(77L)
        )).thenReturn(false);

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> servicio.listar(77L)
        );

        assertEquals(
                HttpStatus.NOT_FOUND,
                error.getStatusCode()
        );
    }

    @Test
    void devuelveListaVaciaSinPendientes() {
        when(jdbc.queryForObject(
                anyString(),
                eq(Boolean.class),
                eq(8L)
        )).thenReturn(true);

        when(jdbc.query(
                anyString(),
               org.mockito.ArgumentMatchers.<org.springframework.jdbc.core.RowMapper<
                ConsultaPendientesServicio.EstudiantePendiente>>any(),
                eq(8L)
        )).thenReturn(List.of());

        assertTrue(servicio.listar(8L).isEmpty());
    }

    @Test
    void consultaSoloEstudiantesSinIngresoDelExamen() {
        when(jdbc.queryForObject(
                anyString(),
                eq(Boolean.class),
                eq(8L)
        )).thenReturn(true);

        when(jdbc.query(
                anyString(),
                org.mockito.ArgumentMatchers.<org.springframework.jdbc.core.RowMapper<
                   ConsultaPendientesServicio.EstudiantePendiente>>any(),
                eq(8L)
        )).thenReturn(List.of());

        servicio.listar(8L);

        var sql = org.mockito.ArgumentCaptor.forClass(
                String.class
        );

        verify(jdbc).query(
                sql.capture(),
                org.mockito.ArgumentMatchers.<org.springframework.jdbc.core.RowMapper<
                ConsultaPendientesServicio.EstudiantePendiente>>any(),
                eq(8L)
        );

        assertTrue(
                sql.getValue().contains("NOT EXISTS")
        );

        assertTrue(
                sql.getValue().contains("e.id_examen = ?")
        );

        assertTrue(
                sql.getValue().contains(
                        "ie.id_estudiante = u.id_usuario"
                )
        );
    }

    @Test
    void detalleNoEncontradoDevuelve404() {
        when(jdbc.queryForObject(
                anyString(),
                eq(Boolean.class),
                eq(8L)
        )).thenReturn(true);

        when(jdbc.query(
                anyString(),
                org.mockito.ArgumentMatchers.<org.springframework.jdbc.core.RowMapper<
        ConsultaPendientesServicio.EstudiantePendiente>>any(),
                eq(8L),
                eq(13L)
        )).thenReturn(List.of());

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> servicio.detalle(8L, 13L)
        );

        assertEquals(
                HttpStatus.NOT_FOUND,
                error.getStatusCode()
        );
    }
}
