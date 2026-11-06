
package com.lacomarcasoft.controller;

import com.lacomarcasoft.service.AccesoExamenDocenteServicio;
import com.lacomarcasoft.service.PerfilFotoServicio;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class IdentificacionCodigoControladorTest {

    private JdbcTemplate jdbc;
    private AccesoExamenDocenteServicio acceso;
    private PerfilFotoServicio fotos;
    private IdentificacionCodigoControlador controlador;

    @BeforeEach
    void preparar() {
        jdbc = mock(JdbcTemplate.class);
        acceso = mock(AccesoExamenDocenteServicio.class);
        fotos = mock(PerfilFotoServicio.class);

        controlador = new IdentificacionCodigoControlador(
                jdbc, acceso, fotos
        );

        when(acceso.obtenerDocenteAutenticado())
                .thenReturn(1L);
    }

    private IdentificacionCodigoControlador
            .EstudianteIdentificadoCodigo estudiante() {

        return new IdentificacionCodigoControlador
                .EstudianteIdentificadoCodigo(
                    25L,
                    "12345678",
                    "202012345",
                    "Juan Perez",
                    "75347806",
                    true
                );
    }

    private void prepararResultados(
            String codigo,
            List<IdentificacionCodigoControlador
                    .EstudianteIdentificadoCodigo> resultados) {

        when(jdbc.query(
                anyString(),
                org.mockito.ArgumentMatchers
                    .<RowMapper<IdentificacionCodigoControlador
                        .EstudianteIdentificadoCodigo>>any(),
                eq(codigo)
        )).thenReturn(resultados);
    }

    @Test
    void debeIdentificarEstudiante() {
        prepararResultados(
                "202012345",
                List.of(estudiante())
        );

        var resultado = controlador.identificar("202012345");

        assertEquals(25L, resultado.idEstudiante());
        assertEquals(
                "202012345",
                resultado.codigoUniversitario()
        );
        assertEquals("Juan Perez", resultado.nombreEstudiante());
        assertEquals("12345678", resultado.documentoIdentidad());
        assertTrue(resultado.tieneFoto());
    }

    @Test
    void debeRechazarCodigoVacio() {
        for (String codigo : new String[]{null, "", "   "}) {
            var error = assertThrows(
                    ResponseStatusException.class,
                    () -> controlador.identificar(codigo)
            );

            assertEquals(
                    HttpStatus.BAD_REQUEST,
                    error.getStatusCode()
            );
        }

        verifyNoInteractions(jdbc);
    }

    @Test
    void debeRechazarFormatoInvalido() {
        for (String codigo : new String[]{
                "2020@123",
                "2020 123",
                "-2020123",
                "2020123-",
                "2020--123"
        }) {
            var error = assertThrows(
                    ResponseStatusException.class,
                    () -> controlador.identificar(codigo)
            );

            assertEquals(
                    HttpStatus.BAD_REQUEST,
                    error.getStatusCode()
            );
        }
    }

    @Test
    void debeRechazarCodigoDemasiadoLargo() {
        String codigo = "1234567890123456789012345678901";

        var error = assertThrows(
                ResponseStatusException.class,
                () -> controlador.identificar(codigo)
        );

        assertEquals(
                HttpStatus.BAD_REQUEST,
                error.getStatusCode()
        );
    }

    @Test
    void debeIgnorarEspaciosExteriores() {
        prepararResultados(
                "202012345",
                List.of(estudiante())
        );

        var resultado =
                controlador.identificar("  202012345  ");

        assertEquals(
                "202012345",
                resultado.codigoUniversitario()
        );
    }

    @Test
    void debeInformarEstudianteNoEncontrado() {
        prepararResultados(
                "999999999",
                List.of()
        );

        var error = assertThrows(
                ResponseStatusException.class,
                () -> controlador.identificar("999999999")
        );

        assertEquals(
                HttpStatus.NOT_FOUND,
                error.getStatusCode()
        );
    }

    @Test
    void debeDetectarCodigosDuplicados() {
        prepararResultados(
                "202012345",
                List.of(estudiante(), estudiante())
        );

        var error = assertThrows(
                ResponseStatusException.class,
                () -> controlador.identificar("202012345")
        );

        assertEquals(
                HttpStatus.CONFLICT,
                error.getStatusCode()
        );
    }

    @Test
    void debeRechazarAccesoNoAutorizado() {
        when(acceso.obtenerDocenteAutenticado())
                .thenThrow(new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Sin permisos"
                ));

        var error = assertThrows(
                ResponseStatusException.class,
                () -> controlador.identificar("202012345")
        );

        assertEquals(
                HttpStatus.FORBIDDEN,
                error.getStatusCode()
        );

        verifyNoInteractions(jdbc);
    }
}
