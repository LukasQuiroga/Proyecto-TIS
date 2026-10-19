
package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.request.ConfigurarExamenSolicitud;
import com.lacomarcasoft.dto.request.RegistrarExamenSolicitud;
import com.lacomarcasoft.dto.response.ExamenRespuesta;
import com.lacomarcasoft.modelo.Examen;
import com.lacomarcasoft.modelo.Materia;
import com.lacomarcasoft.repository.AsignaturaCarreraRepositorio;
import com.lacomarcasoft.repository.CarreraRepositorio;
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
    private MateriaRepositorio materiaRepositorio;
    private ExamenServicio examenServicio;

    @BeforeEach
    void preparar() {
        examenRepositorio = mock(ExamenRepositorio.class);

        materiaRepositorio = mock(MateriaRepositorio.class);

        AsignaturaCarreraRepositorio asignaturaCarreraRepositorio =
                mock(AsignaturaCarreraRepositorio.class);
        CarreraRepositorio carreraRepositorio =
                mock(CarreraRepositorio.class);

        examenServicio = new ExamenServicio(
                examenRepositorio,
                materiaRepositorio,
                asignaturaCarreraRepositorio,
                carreraRepositorio
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

        assertEquals(
                120,
                respuesta.duracionMinutos()
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

        assertEquals(
                90,
                respuesta.duracionMinutos()
        );

        verify(examenRepositorio).save(examen);
    }

@Test
void debeAceptarDuracionMinimaDeUnMinuto() {

        LocalDate fecha = LocalDate.now(ZONA_BOLIVIA)
                .plusDays(1);

        Examen examen = new Examen();
        examen.setIdExamen(20L);

        when(examenRepositorio.obtenerDetalle(20L))
                .thenReturn(Optional.of(examen));

        when(examenRepositorio.save(examen))
                .thenReturn(examen);

        ConfigurarExamenSolicitud solicitud =
                new ConfigurarExamenSolicitud(
                        fecha,
                        LocalTime.of(8, 0),
                        1
                );

        ExamenRespuesta respuesta =
                examenServicio.configurar(20L, solicitud);

        assertEquals(
                LocalTime.of(8, 1),
                respuesta.horaFin()
        );

        assertEquals(
                1,
                respuesta.duracionMinutos()
        );

        verify(examenRepositorio).save(examen);
}

@Test
void debeAceptarDuracionMaximaDelMismoDia() {

        LocalDate fecha = LocalDate.now(ZONA_BOLIVIA)
                .plusDays(1);

        Examen examen = new Examen();
        examen.setIdExamen(21L);

        when(examenRepositorio.obtenerDetalle(21L))
                .thenReturn(Optional.of(examen));

        when(examenRepositorio.save(examen))
                .thenReturn(examen);

        ConfigurarExamenSolicitud solicitud =
                new ConfigurarExamenSolicitud(
                        fecha,
                        LocalTime.MIDNIGHT,
                        1439
                );

        ExamenRespuesta respuesta =
                examenServicio.configurar(21L, solicitud);

        assertEquals(
                LocalTime.of(23, 59),
                respuesta.horaFin()
        );

        assertEquals(
                1439,
                respuesta.duracionMinutos()
        );

        verify(examenRepositorio).save(examen);
}

@Test
void debeRechazarExamenQueTerminaExactamenteEnMedianoche() {

        LocalDate fecha = LocalDate.now(ZONA_BOLIVIA)
                .plusDays(1);

        ConfigurarExamenSolicitud solicitud =
                new ConfigurarExamenSolicitud(
                        fecha,
                        LocalTime.of(23, 0),
                        60
                );

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> examenServicio.configurar(
                        22L, solicitud
                )
        );

        assertEquals(
                HttpStatus.BAD_REQUEST,
                error.getStatusCode()
        );

        verifyNoInteractions(examenRepositorio);
}


    @Test
    void debeRechazarGestionDeOtroAnioAlRegistrar() {

        int anioActual = LocalDate.now(ZONA_BOLIVIA).getYear();

        for (int anio : new int[]{anioActual - 1, anioActual + 1}) {

            RegistrarExamenSolicitud solicitud =
                    new RegistrarExamenSolicitud(
                            "ABC-123",
                            "Primer parcial de prueba",
                            1L,
                            "PRIMER_PARCIAL",
                            "1/" + anio,
                            "ACTIVO",
                            null,
                            null,
                            null,
                            null
                    );

            ResponseStatusException error = assertThrows(
                    ResponseStatusException.class,
                    () -> examenServicio.registrar(solicitud)
            );

            assertEquals(
                    HttpStatus.BAD_REQUEST,
                    error.getStatusCode()
            );

            assertTrue(error.getReason().contains("año actual"));
        }

        verifyNoInteractions(examenRepositorio);
    }

    @Test
    void debeRechazarGestionDeOtroAnioAlEditar() {

        int anioActual = LocalDate.now(ZONA_BOLIVIA).getYear();

        Examen examen = new Examen();
        examen.setIdExamen(10L);

        when(examenRepositorio.obtenerDetalle(10L))
                .thenReturn(Optional.of(examen));

        for (int anio : new int[]{anioActual - 1, anioActual + 1}) {

            RegistrarExamenSolicitud solicitud =
                    new RegistrarExamenSolicitud(
                            "ABC-123",
                            "Primer parcial de prueba",
                            1L,
                            "PRIMER_PARCIAL",
                            "1/" + anio,
                            "ACTIVO",
                            null,
                            null,
                            null,
                            null
                    );

            ResponseStatusException error = assertThrows(
                    ResponseStatusException.class,
                    () -> examenServicio.actualizar(10L, solicitud)
            );

            assertEquals(
                    HttpStatus.BAD_REQUEST,
                    error.getStatusCode()
            );

            assertTrue(error.getReason().contains("año actual"));
        }

        verify(examenRepositorio, never())
                .save(any(Examen.class));
    }

    @Test
    void debeRechazarCambioDeAsignaturaAlEditar() {

        int anioActual = LocalDate.now(ZONA_BOLIVIA).getYear();

        Materia materiaOriginal = new Materia();
        materiaOriginal.setIdMateria(7L);

        Examen examen = new Examen();
        examen.setIdExamen(30L);
        examen.setMateria(materiaOriginal);

        when(examenRepositorio.obtenerDetalle(30L))
                .thenReturn(Optional.of(examen));

        RegistrarExamenSolicitud solicitud =
                new RegistrarExamenSolicitud(
                        "FIN-030",
                        "Examen final actualizado",
                        8L,
                        "FINAL",
                        "1/" + anioActual,
                        "ACTIVO",
                        null,
                        null,
                        null,
                        null
                );

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> examenServicio.actualizar(30L, solicitud)
        );

        assertEquals(
                HttpStatus.BAD_REQUEST,
                error.getStatusCode()
        );

        assertEquals(
                "No se puede cambiar la asignatura de un examen existente",
                error.getReason()
        );

        assertSame(materiaOriginal, examen.getMateria());

        verify(examenRepositorio, never())
                .save(any(Examen.class));

        verifyNoInteractions(materiaRepositorio);
    }

    @Test
    void debePermitirEditarSinCambiarAsignatura() {

        int anioActual = LocalDate.now(ZONA_BOLIVIA).getYear();

        Materia materiaOriginal = new Materia();
        materiaOriginal.setIdMateria(7L);

        Examen examen = new Examen();
        examen.setIdExamen(31L);
        examen.setMateria(materiaOriginal);

        when(examenRepositorio.obtenerDetalle(31L))
                .thenReturn(Optional.of(examen));

        when(materiaRepositorio.findById(7L))
                .thenReturn(Optional.of(materiaOriginal));

        when(examenRepositorio.save(examen))
                .thenReturn(examen);

        RegistrarExamenSolicitud solicitud =
                new RegistrarExamenSolicitud(
                        "FIN-031",
                        "Examen final actualizado",
                        7L,
                        "FINAL",
                        "1/" + anioActual,
                        "ACTIVO",
                        "Descripción actualizada",
                        null,
                        null,
                        null
                );

        ExamenRespuesta respuesta =
                examenServicio.actualizar(31L, solicitud);

        assertEquals(7L, respuesta.idMateria());

        assertEquals(
                "Examen final actualizado",
                respuesta.nombreExamen()
        );

        assertSame(materiaOriginal, examen.getMateria());

        verify(examenRepositorio).save(examen);
    }
}
