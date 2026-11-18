
package com.lacomarcasoft.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ResumenIngresosControladorTest {

    private JdbcTemplate jdbc;
    private ResumenIngresosControlador controlador;

    @BeforeEach
    void preparar() {
        jdbc = mock(JdbcTemplate.class);
        controlador = new ResumenIngresosControlador(jdbc);
    }

    private Authentication autenticacion(String... permisos) {
        return new UsernamePasswordAuthenticationToken(
                "usuario",
                "",
                Arrays.stream(permisos)
                        .map(SimpleGrantedAuthority::new)
                        .collect(Collectors.toList())
        );
    }

    @Test
    void debeRechazarSolicitudSinSesion() {
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controlador.obtenerResumen(null, null)
        );

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
        verifyNoInteractions(jdbc);
    }

    @Test
    void debeRechazarDocenteAunqueTengaPermisoDeIngreso() {
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controlador.obtenerResumen(
                        null,
                        autenticacion(
                                "ROLE_DOCENTE",
                                "CONTROL_INGRESO"
                        )
                )
        );

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        verifyNoInteractions(jdbc);
    }

    @Test
    void debeRechazarAdministradorSinPermisoDeReportes() {
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controlador.obtenerResumen(
                        null,
                        autenticacion("ROLE_ADMINISTRADOR")
                )
        );

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        verifyNoInteractions(jdbc);
    }

    @Test
    void debeValidarIdentificadorDeExamen() {
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controlador.obtenerResumen(
                        0L,
                        autenticacion(
                                "ROLE_ADMINISTRADOR",
                                "GENERAR_REPORTES"
                        )
                )
        );

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        verifyNoInteractions(jdbc);
    }

    @Test
    void debeDevolver404ParaExamenInexistente() {
        when(
                jdbc.queryForObject(
                        anyString(),
                        eq(Boolean.class),
                        eq(999L)
                )
        ).thenReturn(false);

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> controlador.obtenerResumen(
                        999L,
                        autenticacion(
                                "ROLE_ADMINISTRADOR",
                                "GENERAR_REPORTES"
                        )
                )
        );

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
    }

    @Test
    void debeDevolverContadoresAlAdministradorAutorizado() {
        when(
                jdbc.queryForObject(
                        anyString(),
                        eq(Long.class)
                )
        ).thenReturn(16L, 24L, 29L);

        var respuesta = controlador.obtenerResumen(
                null,
                autenticacion(
                        "ROLE_ADMINISTRADOR",
                        "GENERAR_REPORTES"
                )
        );

        assertEquals(16L, respuesta.ingresados());
        assertEquals(24L, respuesta.pendientes());
        assertEquals(29L, respuesta.rechazados());
    }
}

