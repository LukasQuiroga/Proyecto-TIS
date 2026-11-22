package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.response.MensajeRespuesta;
import com.lacomarcasoft.dto.response.MensajeRespuesta;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class IntentoIngresoNoAutorizadoServicioTest {

    private JdbcTemplate jdbc;
    private AccesoExamenDocenteServicio acceso;
    private IntentoIngresoNoAutorizadoServicio servicio;

    @BeforeEach
    void preparar() {
        jdbc = mock(JdbcTemplate.class);
        acceso = mock(AccesoExamenDocenteServicio.class);
        servicio = new IntentoIngresoNoAutorizadoServicio(jdbc, acceso);
    }

    private IntentoIngresoNoAutorizadoServicio.Intento incidenciaPendiente() {
        return new IntentoIngresoNoAutorizadoServicio.Intento(
            10L,
            2L,
            3L,
            "202012345",
            "Juan Perez",
            "Examen 1",
            "SISTEMA",
            "Ingreso duplicado",
            null,
            null,
            "Docente Responsable",
            OffsetDateTime.now(),
            "PENDIENTE",
            null,
            null,
            null,
            "202012345",
            "12345678"
        );
    }

    private IntentoIngresoNoAutorizadoServicio.Intento incidenciaResuelta() {
        return new IntentoIngresoNoAutorizadoServicio.Intento(
            10L,
            2L,
            3L,
            "202012345",
            "Juan Perez",
            "Examen 1",
            "SISTEMA",
            "Ingreso duplicado",
            null,
            null,
            "Docente Responsable",
            OffsetDateTime.now(),
            "RESUELTA",
            "El estudiante intento ingresar nuevamente",
            OffsetDateTime.now(),
            "intentos/2/3/uuid.jpg",
            "202012345",
            "12345678"
        );
    }

    // CA: el veredicto es obligatorio para resolver la incidencia
    @Test
    void debeRechazarResolverSinVeredicto() {
        ResponseStatusException error = assertThrows(
            ResponseStatusException.class,
            () -> servicio.resolver(10L, "   ")
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
    }

    // CA: el veredicto no puede superar los 200 caracteres
    @Test
    void debeRechazarResolverConVeredictoExcesivo() {
        ResponseStatusException error = assertThrows(
            ResponseStatusException.class,
            () -> servicio.resolver(10L, "a".repeat(201))
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
    }

    // CA: se acepta un veredicto de exactamente 200 caracteres
    @Test
    void debeAceptarVeredictoDe200Caracteres() {
        String veredicto = "a".repeat(200);

        when(jdbc.query(
            anyString(),
            ArgumentMatchers.<RowMapper<IntentoIngresoNoAutorizadoServicio.Intento>>any(),
            eq(10L)
        )).thenReturn(List.of(incidenciaPendiente()));
        when(acceso.verificarExamenActual(2L)).thenReturn(null);
        when(acceso.obtenerDocenteAutenticado()).thenReturn(7L);
        when(jdbc.update(anyString(), any(), any(), any())).thenReturn(1);

        MensajeRespuesta respuesta = servicio.resolver(10L, veredicto);

        assertNotNull(respuesta);
        verify(jdbc).update(anyString(), eq(veredicto), eq(7L), eq(10L));
    }

    // CA: el veredicto solo admite letras, numeros y espacios
    @Test
    void debeRechazarResolverConCaracteresInvalidos() {
        ResponseStatusException error = assertThrows(
            ResponseStatusException.class,
            () -> servicio.resolver(10L, "Veredicto con @#$ invalidos")
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
    }

    // CA: una incidencia ya resuelta no puede resolverse nuevamente
    @Test
    void debeRechazarResolverDeIncidenciaYaResuelta() {
        when(jdbc.query(
            anyString(),
            ArgumentMatchers.<RowMapper<IntentoIngresoNoAutorizadoServicio.Intento>>any(),
            eq(10L)
        )).thenReturn(List.of(incidenciaResuelta()));

        ResponseStatusException error = assertThrows(
            ResponseStatusException.class,
            () -> servicio.resolver(10L, "Veredicto valido")
        );

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
    }

    // CA: resolver la incidencia marca estado, veredicto y responsable
    @Test
    void debeResolverIncidencia() {
        when(jdbc.query(
            anyString(),
            ArgumentMatchers.<RowMapper<IntentoIngresoNoAutorizadoServicio.Intento>>any(),
            eq(10L)
        )).thenReturn(List.of(incidenciaPendiente()));
        when(acceso.verificarExamenActual(2L)).thenReturn(null);
        when(acceso.obtenerDocenteAutenticado()).thenReturn(7L);
        when(jdbc.update(
            anyString(),
            any(),
            any(),
            any()
        )).thenReturn(1);

        MensajeRespuesta respuesta = servicio.resolver(10L, "Veredicto valido");

        assertNotNull(respuesta);
        assertEquals("Incidencia resuelta correctamente", respuesta.mensaje());

        verify(jdbc).update(
            anyString(),
            eq("Veredicto valido"),
            eq(7L),
            eq(10L)
        );
    }
}
