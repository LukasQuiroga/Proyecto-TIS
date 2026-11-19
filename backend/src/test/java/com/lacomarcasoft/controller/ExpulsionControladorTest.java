
package com.lacomarcasoft.controller;

import com.lacomarcasoft.dto.request.RegistrarExpulsionSolicitud;
import com.lacomarcasoft.modelo.Expulsion;
import com.lacomarcasoft.service.ExpulsionServicio;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ExpulsionControladorTest {

    private ExpulsionServicio servicio;
    private ExpulsionControlador controlador;

    @BeforeEach
    void preparar() {
        servicio = mock(ExpulsionServicio.class);
        controlador = new ExpulsionControlador(servicio);
    }

    private RegistrarExpulsionSolicitud solicitudValida() {
        return new RegistrarExpulsionSolicitud(
            12L,
            45L,
            OffsetDateTime.parse("2026-11-19T09:35:00-04:00"),
            "Uso de material no autorizado",
            "Se notifico al encargado"
        );
    }

    @Test
    void registraConResponsableAutenticado() {
        RegistrarExpulsionSolicitud solicitud = solicitudValida();

        Authentication autenticacion = mock(Authentication.class);
        when(autenticacion.getDetails()).thenReturn(7L);

        Expulsion expulsion = new Expulsion();
        expulsion.setFechaHoraExpulsion(solicitud.fechaHoraExpulsion());
        expulsion.setMotivo(solicitud.motivo());
        expulsion.setObservaciones(solicitud.observaciones());

        when(servicio.registrar(solicitud, 7L))
            .thenReturn(expulsion);

        var respuesta = controlador.registrar(
            solicitud,
            autenticacion
        );

        assertEquals(12L, respuesta.idExamen());
        assertEquals(45L, respuesta.idEstudiante());
        assertEquals(
            solicitud.fechaHoraExpulsion(),
            respuesta.fechaHoraExpulsion()
        );
        assertEquals(
            solicitud.motivo(),
            respuesta.motivo()
        );

        verify(servicio).registrar(solicitud, 7L);
    }

    @Test
    void rechazaRegistroSinAutenticacion() {
        RegistrarExpulsionSolicitud solicitud = solicitudValida();

        when(servicio.registrar(same(solicitud), isNull()))
            .thenThrow(new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Debe iniciar sesion"
            ));

        ResponseStatusException error = assertThrows(
            ResponseStatusException.class,
            () -> controlador.registrar(solicitud, null)
        );

        assertEquals(
            HttpStatus.UNAUTHORIZED,
            error.getStatusCode()
        );

        verify(servicio).registrar(same(solicitud), isNull());
    }
}
