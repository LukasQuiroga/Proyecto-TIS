
package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.request.ConfigurarExamenSolicitud;
import com.lacomarcasoft.dto.response.ExamenRespuesta;
import com.lacomarcasoft.modelo.Examen;
import com.lacomarcasoft.repository.ExamenRepositorio;
import com.lacomarcasoft.repository.MateriaRepositorio;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ExamenServicioTest {

    private static final ZoneId ZONA_BOLIVIA =
            ZoneId.of("America/La_Paz");

    private ExamenRepositorio examenRepositorio;
    private ExamenServicio examenServicio;

    @BeforeEach
    void preparar() {
        examenRepositorio = mock(ExamenRepositorio.class);

        MateriaRepositorio materiaRepositorio =
                mock(MateriaRepositorio.class);

        examenServicio = new ExamenServicio(
                examenRepositorio,
                materiaRepositorio
        );
    }

    @Test
    void debeConfigurarExamenCorrectamente() {

        LocalDate fecha = LocalDate.now(ZONA_BOLIVIA)
                .plusDays(1);

        Examen examen = new Examen();
        examen.setIdExamen(10L);

        when(examenRepositorio.obtenerDetalle(10L))
                .thenReturn(Optional.of(examen));

        when(examenRepositorio.save(examen))
                .thenReturn(examen);

        ConfigurarExamenSolicitud solicitud =
                new ConfigurarExamenSolicitud(
                        fecha,
                        LocalTime.of(8, 0),
                        120
                );

        ExamenRespuesta respuesta =
                examenServicio.configurar(10L, solicitud);

        assertEquals(10L, respuesta.idExamen());
        assertEquals(fecha, respuesta.fechaExamen());
        assertEquals(
                LocalTime.of(8, 0),
                respuesta.horaInicio()
        );
        assertEquals(
                LocalTime.of(10, 0),
                respuesta.horaFin()
        );

        verify(examenRepositorio).save(examen);
    }

    @Test
    void debeRechazarFechaPasada() {

        ConfigurarExamenSolicitud solicitud =
                new ConfigurarExamenSolicitud(
                        LocalDate.now(ZONA_BOLIVIA)
                                .minusDays(1),
                        LocalTime.of(8, 0),
                        120
                );

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> examenServicio.configurar(1L, solicitud)
        );

        assertEquals(
                HttpStatus.BAD_REQUEST,
                error.getStatusCode()
        );

        verifyNoInteractions(examenRepositorio);
    }

    @Test
    void debeRechazarHoraPasadaDelDiaActual() {

        ConfigurarExamenSolicitud solicitud =
                new ConfigurarExamenSolicitud(
                        LocalDate.now(ZONA_BOLIVIA),
                        LocalTime.MIDNIGHT,
                        120
                );

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> examenServicio.configurar(1L, solicitud)
        );

        assertEquals(
                HttpStatus.BAD_REQUEST,
                error.getStatusCode()
        );

        verifyNoInteractions(examenRepositorio);
    }

    @Test
    void debeRechazarDuracionInvalida() {

        LocalDate fecha = LocalDate.now(ZONA_BOLIVIA)
                .plusDays(1);

        ConfigurarExamenSolicitud duracionCero =
                new ConfigurarExamenSolicitud(
                        fecha,
                        LocalTime.of(8, 0),
                        0
                );

        ConfigurarExamenSolicitud duracionExcesiva =
                new ConfigurarExamenSolicitud(
                        fecha,
                        LocalTime.of(8, 0),
                        1440
                );

        ResponseStatusException errorCero = assertThrows(
                ResponseStatusException.class,
                () -> examenServicio.configurar(
                        1L, duracionCero
                )
        );

        ResponseStatusException errorExcesivo = assertThrows(
                ResponseStatusException.class,
                () -> examenServicio.configurar(
                        1L, duracionExcesiva
                )
        );

        assertEquals(
                HttpStatus.BAD_REQUEST,
                errorCero.getStatusCode()
        );

        assertEquals(
                HttpStatus.BAD_REQUEST,
                errorExcesivo.getStatusCode()
        );

        verifyNoInteractions(examenRepositorio);
    }

    @Test
    void debeRechazarCamposObligatoriosVacios() {

        LocalDate fecha = LocalDate.now(ZONA_BOLIVIA)
                .plusDays(1);

        ConfigurarExamenSolicitud sinFecha =
                new ConfigurarExamenSolicitud(
                        null,
                        LocalTime.of(8, 0),
                        120
                );

        ConfigurarExamenSolicitud sinHora =
                new ConfigurarExamenSolicitud(
                        fecha,
                        null,
                        120
                );

        ConfigurarExamenSolicitud sinDuracion =
                new ConfigurarExamenSolicitud(
                        fecha,
                        LocalTime.of(8, 0),
                        null
                );

        for (ConfigurarExamenSolicitud solicitud :
                new ConfigurarExamenSolicitud[]{
                        sinFecha, sinHora, sinDuracion
                }) {

            ResponseStatusException error = assertThrows(
                    ResponseStatusException.class,
                    () -> examenServicio.configurar(
                            1L, solicitud
                    )
            );

            assertEquals(
                    HttpStatus.BAD_REQUEST,
                    error.getStatusCode()
            );
        }

        verifyNoInteractions(examenRepositorio);
    }

    @Test
    void debeRechazarExamenInexistente() {

        LocalDate fecha = LocalDate.now(ZONA_BOLIVIA)
                .plusDays(1);

        when(examenRepositorio.obtenerDetalle(999L))
                .thenReturn(Optional.empty());

        ConfigurarExamenSolicitud solicitud =
                new ConfigurarExamenSolicitud(
                        fecha,
                        LocalTime.of(8, 0),
                        120
                );

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> examenServicio.configurar(
                        999L, solicitud
                )
        );

        assertEquals(
                HttpStatus.NOT_FOUND,
                error.getStatusCode()
        );

        verify(examenRepositorio, never())
                .save(any(Examen.class));
    }

    @Test
    void debeRechazarExamenQueTerminaAlDiaSiguiente() {

        LocalDate fecha = LocalDate.now(ZONA_BOLIVIA)
                .plusDays(1);

        ConfigurarExamenSolicitud solicitud =
                new ConfigurarExamenSolicitud(
                        fecha,
                        LocalTime.of(23, 30),
                        60
                );

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> examenServicio.configurar(
                        1L, solicitud
                )
        );

        assertEquals(
                HttpStatus.BAD_REQUEST,
                error.getStatusCode()
        );

        verifyNoInteractions(examenRepositorio);
    }

    @Test
    void debeActualizarConfiguracionExistente() {

        LocalDate fecha = LocalDate.now(ZONA_BOLIVIA)
                .plusDays(2);

        Examen examen = new Examen();
        examen.setIdExamen(5L);
        examen.setFechaExamen(fecha.minusDays(1));
        examen.setHoraInicio(LocalTime.of(9, 0));
        examen.setHoraFin(LocalTime.of(11, 0));

        when(examenRepositorio.obtenerDetalle(5L))
                .thenReturn(Optional.of(examen));

        when(examenRepositorio.save(examen))
                .thenReturn(examen);

        ConfigurarExamenSolicitud solicitud =
                new ConfigurarExamenSolicitud(
                        fecha,
                        LocalTime.of(14, 0),
                        90
                );

        ExamenRespuesta respuesta =
                examenServicio.configurar(5L, solicitud);

        assertEquals(fecha, respuesta.fechaExamen());

        assertEquals(
                LocalTime.of(14, 0),
                respuesta.horaInicio()
        );

        assertEquals(
                LocalTime.of(15, 30),
                respuesta.horaFin()
        );

        verify(examenRepositorio).save(examen);
    }
}
