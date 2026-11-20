
package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.request.RegistrarExpulsionSolicitud;
import com.lacomarcasoft.modelo.Examen;
import com.lacomarcasoft.modelo.Expulsion;
import com.lacomarcasoft.modelo.Usuario;
import com.lacomarcasoft.repository.ConsultaExamenEstudianteRepositorio;
import com.lacomarcasoft.repository.ExamenRepositorio;
import com.lacomarcasoft.repository.ExpulsionRepositorio;
import com.lacomarcasoft.repository.UsuarioRepositorio;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ExpulsionServicioTest {

    private ExpulsionRepositorio expulsiones;
    private ExamenRepositorio examenes;
    private UsuarioRepositorio usuarios;
    private ConsultaExamenEstudianteRepositorio inscripciones;
    private ExpulsionServicio servicio;

    @BeforeEach
    void preparar() {
        expulsiones = mock(ExpulsionRepositorio.class);
        examenes = mock(ExamenRepositorio.class);
        usuarios = mock(UsuarioRepositorio.class);
        inscripciones = mock(ConsultaExamenEstudianteRepositorio.class);

        servicio = new ExpulsionServicio(
            expulsiones,
            examenes,
            usuarios,
            inscripciones
        );
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

    private void prepararDatosValidos() {
        when(examenes.existsById(12L)).thenReturn(true);
        when(usuarios.existsById(45L)).thenReturn(true);
        when(usuarios.existsById(7L)).thenReturn(true);
        when(inscripciones.existeInscripcion(12L, 45L))
            .thenReturn(true);
    }

    @Test
    void registraExpulsionValida() {
        prepararDatosValidos();

        Examen examen = mock(Examen.class);
        Usuario estudiante = mock(Usuario.class);
        Usuario responsable = mock(Usuario.class);

        when(examenes.getReferenceById(12L)).thenReturn(examen);
        when(usuarios.getReferenceById(45L)).thenReturn(estudiante);
        when(usuarios.getReferenceById(7L)).thenReturn(responsable);

        when(expulsiones.save(any(Expulsion.class)))
            .thenAnswer(invocacion -> invocacion.getArgument(0));

        Expulsion resultado = servicio.registrar(
            solicitudValida(),
            7L
        );

        ArgumentCaptor<Expulsion> captor =
            ArgumentCaptor.forClass(Expulsion.class);

        verify(expulsiones).save(captor.capture());

        Expulsion guardada = captor.getValue();

        assertSame(guardada, resultado);
        assertSame(examen, guardada.getExamen());
        assertSame(estudiante, guardada.getEstudiante());
        assertSame(responsable, guardada.getResponsable());

        assertEquals(
            solicitudValida().fechaHoraExpulsion(),
            guardada.getFechaHoraExpulsion()
        );

        assertEquals(
            "Uso de material no autorizado",
            guardada.getMotivo()
        );

        assertEquals(
            "Se notifico al encargado",
            guardada.getObservaciones()
        );
    }

    @Test
    void rechazaResponsableNoAutenticado() {
        ResponseStatusException error = assertThrows(
            ResponseStatusException.class,
            () -> servicio.registrar(solicitudValida(), null)
        );

        assertEquals(
            HttpStatus.UNAUTHORIZED,
            error.getStatusCode()
        );

        verifyNoInteractions(expulsiones);
    }

    @Test
    void rechazaSolicitudInvalida() {
        RegistrarExpulsionSolicitud solicitud =
            new RegistrarExpulsionSolicitud(
                12L,
                45L,
                OffsetDateTime.parse("2026-11-19T09:35:00-04:00"),
                "   ",
                null
            );

        ResponseStatusException error = assertThrows(
            ResponseStatusException.class,
            () -> servicio.registrar(solicitud, 7L)
        );

        assertEquals(
            HttpStatus.BAD_REQUEST,
            error.getStatusCode()
        );

        verifyNoInteractions(expulsiones);
    }

    @Test
    void rechazaExamenInexistente() {
        when(examenes.existsById(12L)).thenReturn(false);

        ResponseStatusException error = assertThrows(
            ResponseStatusException.class,
            () -> servicio.registrar(solicitudValida(), 7L)
        );

        assertEquals(
            HttpStatus.NOT_FOUND,
            error.getStatusCode()
        );

        verify(expulsiones, never()).save(any());
    }

    @Test
    void rechazaEstudianteInexistente() {
        when(examenes.existsById(12L)).thenReturn(true);
        when(usuarios.existsById(45L)).thenReturn(false);

        ResponseStatusException error = assertThrows(
            ResponseStatusException.class,
            () -> servicio.registrar(solicitudValida(), 7L)
        );

        assertEquals(
            HttpStatus.NOT_FOUND,
            error.getStatusCode()
        );

        verify(expulsiones, never()).save(any());
    }

    @Test
    void rechazaResponsableInexistente() {
        when(examenes.existsById(12L)).thenReturn(true);
        when(usuarios.existsById(45L)).thenReturn(true);
        when(usuarios.existsById(7L)).thenReturn(false);

        ResponseStatusException error = assertThrows(
            ResponseStatusException.class,
            () -> servicio.registrar(solicitudValida(), 7L)
        );

        assertEquals(
            HttpStatus.UNAUTHORIZED,
            error.getStatusCode()
        );

        verify(expulsiones, never()).save(any());
    }

    @Test
    void rechazaEstudianteNoInscrito() {
        prepararDatosValidos();

        when(inscripciones.existeInscripcion(12L, 45L))
            .thenReturn(false);

        ResponseStatusException error = assertThrows(
            ResponseStatusException.class,
            () -> servicio.registrar(solicitudValida(), 7L)
        );

        assertEquals(
            HttpStatus.BAD_REQUEST,
            error.getStatusCode()
        );

        verify(expulsiones, never()).save(any());
    }

    @Test
    void rechazaExpulsionDuplicada() {
        prepararDatosValidos();

        when(expulsiones.existsByExamen_IdExamenAndEstudiante_IdUsuario(
            12L, 45L
        )).thenReturn(true);

        ResponseStatusException error = assertThrows(
            ResponseStatusException.class,
            () -> servicio.registrar(solicitudValida(), 7L)
        );

        assertEquals(
            HttpStatus.CONFLICT,
            error.getStatusCode()
        );

        verify(expulsiones, never()).save(any());
    }

    @Test
    void historialRechazaExamenInvalido() {
        ResponseStatusException error = assertThrows(
            ResponseStatusException.class,
            () -> servicio.listarHistorial(0L)
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        verifyNoInteractions(examenes, expulsiones);
    }

    @Test
    void historialRechazaExamenInexistente() {
        when(examenes.existsById(99L)).thenReturn(false);

        ResponseStatusException error = assertThrows(
            ResponseStatusException.class,
            () -> servicio.listarHistorial(99L)
        );

        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());

        verify(expulsiones, never())
            .findByExamen_IdExamenOrderByFechaHoraExpulsionDesc(99L);
    }

    @Test
    void historialDevuelveListaVacia() {
        when(examenes.existsById(12L)).thenReturn(true);

        when(expulsiones.findByExamen_IdExamenOrderByFechaHoraExpulsionDesc(12L))
            .thenReturn(List.of());

        var resultado = servicio.listarHistorial(12L);

        assertTrue(resultado.isEmpty());

        verify(expulsiones)
            .findByExamen_IdExamenOrderByFechaHoraExpulsionDesc(12L);
    }

    @Test
    void historialDevuelveDatosDeExpulsionRegistrada() {
        when(examenes.existsById(12L)).thenReturn(true);

        Expulsion expulsion = mock(Expulsion.class);
        Usuario estudiante = mock(Usuario.class);
        Usuario responsable = mock(Usuario.class);

        OffsetDateTime fechaExpulsion =
            OffsetDateTime.parse("2026-11-19T09:35:00-04:00");

        OffsetDateTime fechaRegistro =
            OffsetDateTime.parse("2026-11-19T09:40:00-04:00");

        when(expulsion.getIdExpulsion()).thenReturn(90L);
        when(expulsion.getEstudiante()).thenReturn(estudiante);
        when(expulsion.getResponsable()).thenReturn(responsable);
        when(expulsion.getFechaHoraExpulsion()).thenReturn(fechaExpulsion);
        when(expulsion.getFechaHoraRegistro()).thenReturn(fechaRegistro);
        when(expulsion.getMotivo()).thenReturn("Uso de material no autorizado");
        when(expulsion.getObservaciones()).thenReturn("Se notifico al encargado");

        when(estudiante.getIdUsuario()).thenReturn(45L);
        when(estudiante.getNombre()).thenReturn("Ana");
        when(estudiante.getApellido()).thenReturn("Perez");

        when(responsable.getIdUsuario()).thenReturn(7L);

        when(expulsiones.findByExamen_IdExamenOrderByFechaHoraExpulsionDesc(12L))
            .thenReturn(List.of(expulsion));

        var resultado = servicio.listarHistorial(12L);

        assertEquals(1, resultado.size());

        var registro = resultado.get(0);

        assertEquals(90L, registro.idExpulsion());
        assertEquals(45L, registro.idEstudiante());
        assertEquals("Ana Perez", registro.nombreCompleto());
        assertEquals(7L, registro.idResponsable());
        assertEquals(fechaExpulsion, registro.fechaHoraExpulsion());
        assertEquals(fechaRegistro, registro.fechaHoraRegistro());
        assertEquals(
            "Uso de material no autorizado",
            registro.motivo()
        );
        assertEquals(
            "Se notifico al encargado",
            registro.observaciones()
        );
    }
}
