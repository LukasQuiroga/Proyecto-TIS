package com.lacomarcasoft.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

class ResumenIngresosListadoControladorTest {

    private JdbcTemplate jdbc;
    private ResumenIngresosControlador controlador;

    @BeforeEach
    void preparar() {
        jdbc = mock(JdbcTemplate.class);
        controlador = new ResumenIngresosControlador(jdbc);
    }

    private Authentication administrador() {
        return new UsernamePasswordAuthenticationToken(
                "admin", "",
                List.of(
                        new SimpleGrantedAuthority("ROLE_ADMINISTRADOR"),
                        new SimpleGrantedAuthority("GENERAR_REPORTES")
                )
        );
    }

    @Test
    void denegarListadoSinAutenticacion() {
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controlador.listarPorTipo("PENDIENTES", null, null, null, null)
        );
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
        verifyNoInteractions(jdbc);
    }

    @Test
    void denegarListadoConRolDocente() {
        Authentication docente = new UsernamePasswordAuthenticationToken(
                "docente", "",
                List.of(new SimpleGrantedAuthority("ROLE_DOCENTE"))
        );
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controlador.listarPorTipo("RECHAZADOS", null, null, null, docente)
        );
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        verifyNoInteractions(jdbc);
    }

    @Test
    void rechazarTipoNoPermitido() {
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controlador.listarPorTipo("TODOS", null, null, null, administrador())
        );
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        verifyNoInteractions(jdbc);
    }

    @Test
    void rechazarFechaInvalida() {
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controlador.listarPorTipo("PENDIENTES", null, null, "2029-01-01", administrador())
        );
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        verifyNoInteractions(jdbc);
    }

    @Test
    void rechazarBusquedaInvalida() {
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controlador.listarPorTipo("RECHAZADOS", null, "Leticia@", null, administrador())
        );
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        verifyNoInteractions(jdbc);
    }
}
