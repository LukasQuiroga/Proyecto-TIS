
package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.request.RegistrarSituacionExcepcionalSolicitud;
import com.lacomarcasoft.modelo.Examen;
import com.lacomarcasoft.modelo.Rol;
import com.lacomarcasoft.modelo.SituacionExcepcional;
import com.lacomarcasoft.modelo.Usuario;
import com.lacomarcasoft.repository.ConsultaExamenEstudianteRepositorio;
import com.lacomarcasoft.repository.ExamenRepositorio;
import com.lacomarcasoft.repository.SituacionExcepcionalRepositorio;
import com.lacomarcasoft.repository.UsuarioRepositorio;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class SituacionExcepcionalServicioTest {

    private SituacionExcepcionalRepositorio situacionRepositorio;
    private ExamenRepositorio examenRepositorio;
    private UsuarioRepositorio usuarioRepositorio;
    private ConsultaExamenEstudianteRepositorio consultaRepositorio;
    private SituacionExcepcionalServicio servicio;

    @BeforeEach
    void preparar() {
        SecurityContextHolder.clearContext();

        situacionRepositorio = mock(SituacionExcepcionalRepositorio.class);
        examenRepositorio = mock(ExamenRepositorio.class);
        usuarioRepositorio = mock(UsuarioRepositorio.class);
        consultaRepositorio = mock(ConsultaExamenEstudianteRepositorio.class);

        servicio = new SituacionExcepcionalServicio(
                situacionRepositorio,
                examenRepositorio,
                usuarioRepositorio,
                consultaRepositorio
        );
    }

    @AfterEach
    void limpiar() {
        SecurityContextHolder.clearContext();
    }

    private Usuario crearUsuario(String nombreRol) {
        Usuario usuario = mock(Usuario.class);
        Rol rol = mock(Rol.class);

        when(usuario.getActivo()).thenReturn(true);
        when(usuario.getRol()).thenReturn(rol);
        when(rol.getNombreRol()).thenReturn(nombreRol);

        return usuario;
    }

    private void autenticar(Long idUsuario, Usuario usuario, String rol) {
        var autenticacion = new UsernamePasswordAuthenticationToken(
                "usuario@test.com",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + rol))
        );

        autenticacion.setDetails(idUsuario);

        SecurityContextHolder.getContext()
                .setAuthentication(autenticacion);

        when(usuarioRepositorio.findById(idUsuario))
                .thenReturn(Optional.of(usuario));
    }

    private RegistrarSituacionExcepcionalSolicitud solicitudValida(
            Long idExamen,
            Long idEstudiante
    ) {
        return new RegistrarSituacionExcepcionalSolicitud(
                idExamen,
                idEstudiante,
                "Interrupcion del examen",
                "Se produjo un corte de energia electrica",
                LocalDate.of(2026, 11, 19),
                LocalTime.of(10, 30)
        );
    }

    @Test
    void registraSituacionValida() {
        Usuario administrador = crearUsuario("ADMINISTRADOR");
        autenticar(5L, administrador, "ADMINISTRADOR");

        Examen examen = mock(Examen.class);

        when(examenRepositorio.findById(8L))
                .thenReturn(Optional.of(examen));

        when(situacionRepositorio.save(any(SituacionExcepcional.class)))
                .thenAnswer(invocacion -> {
                    SituacionExcepcional situacion = invocacion.getArgument(0);
                    situacion.setIdSituacion(100L);
                    return situacion;
                });

        Long idRegistrado = servicio.registrar(
                solicitudValida(8L, null)
        );

        assertEquals(100L, idRegistrado);

        var captor = org.mockito.ArgumentCaptor.forClass(
                SituacionExcepcional.class
        );

        verify(situacionRepositorio).save(captor.capture());

        SituacionExcepcional guardada = captor.getValue();

        assertSame(examen, guardada.getExamen());
        assertNull(guardada.getEstudiante());
        assertSame(administrador, guardada.getRegistradoPor());
        assertEquals(
                "Interrupcion del examen",
                guardada.getTipoSituacion()
        );

        verifyNoInteractions(consultaRepositorio);
    }

    @Test
    void rechazaUsuarioSinAutenticacion() {
        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> servicio.registrar(solicitudValida(8L, null))
        );

        assertEquals(HttpStatus.UNAUTHORIZED, error.getStatusCode());

        verifyNoInteractions(situacionRepositorio);
    }

    @Test
    void rechazaUsuarioNoAdministrador() {
        Usuario docente = crearUsuario("DOCENTE");
        autenticar(6L, docente, "DOCENTE");

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> servicio.registrar(solicitudValida(8L, null))
        );

        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());

        verifyNoInteractions(situacionRepositorio);
    }

    @Test
    void rechazaDescripcionVacia() {
        Usuario administrador = crearUsuario("ADMINISTRADOR");
        autenticar(5L, administrador, "ADMINISTRADOR");

        when(examenRepositorio.findById(8L))
                .thenReturn(Optional.of(mock(Examen.class)));

        var solicitud = new RegistrarSituacionExcepcionalSolicitud(
                8L,
                null,
                "Interrupcion",
                "   ",
                LocalDate.of(2026, 11, 19),
                LocalTime.of(10, 30)
        );

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> servicio.registrar(solicitud)
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());

        verifyNoInteractions(situacionRepositorio);
    }

    @Test
    void rechazaFechasFueraDelRangoPermitido() {
        Usuario administrador = crearUsuario("ADMINISTRADOR");
        autenticar(5L, administrador, "ADMINISTRADOR");

        when(examenRepositorio.findById(8L))
                .thenReturn(Optional.of(mock(Examen.class)));

        for (LocalDate fechaInvalida : List.of(
                LocalDate.of(1800, 1, 1),
                LocalDate.of(2101, 1, 1)
        )) {
            var solicitud = new RegistrarSituacionExcepcionalSolicitud(
                    8L,
                    null,
                    "Interrupcion del examen",
                    "Corte de energia electrica",
                    fechaInvalida,
                    LocalTime.of(10, 30)
            );

            ResponseStatusException error = assertThrows(
                    ResponseStatusException.class,
                    () -> servicio.registrar(solicitud)
            );

            assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
            assertTrue(error.getReason().contains("entre 1900 y 2100"));
        }

        verifyNoInteractions(situacionRepositorio);
    }

    @Test
    void rechazaExamenInexistente() {
        Usuario administrador = crearUsuario("ADMINISTRADOR");
        autenticar(5L, administrador, "ADMINISTRADOR");

        when(examenRepositorio.findById(99L))
                .thenReturn(Optional.empty());

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> servicio.registrar(solicitudValida(99L, null))
        );

        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());

        verifyNoInteractions(situacionRepositorio);
    }

    @Test
    void rechazaEstudianteNoAsociado() {
        Usuario administrador = crearUsuario("ADMINISTRADOR");
        autenticar(5L, administrador, "ADMINISTRADOR");

        when(examenRepositorio.findById(8L))
                .thenReturn(Optional.of(mock(Examen.class)));

        Usuario estudiante = crearUsuario("ESTUDIANTE");

        when(usuarioRepositorio.findById(12L))
                .thenReturn(Optional.of(estudiante));

        when(consultaRepositorio.existeInscripcion(8L, 12L))
                .thenReturn(false);

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> servicio.registrar(solicitudValida(8L, 12L))
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());

        verify(consultaRepositorio).existeInscripcion(8L, 12L);
        verifyNoInteractions(situacionRepositorio);
    }

    @Test
    void registraSituacionConEstudianteAsociado() {
        Usuario administrador = crearUsuario("ADMINISTRADOR");
        autenticar(5L, administrador, "ADMINISTRADOR");

        Examen examen = mock(Examen.class);
        Usuario estudiante = crearUsuario("ESTUDIANTE");

        when(examenRepositorio.findById(8L))
                .thenReturn(Optional.of(examen));

        when(usuarioRepositorio.findById(12L))
                .thenReturn(Optional.of(estudiante));

        when(consultaRepositorio.existeInscripcion(8L, 12L))
                .thenReturn(true);

        when(situacionRepositorio.save(any(SituacionExcepcional.class)))
                .thenAnswer(invocacion -> {
                    SituacionExcepcional situacion = invocacion.getArgument(0);
                    situacion.setIdSituacion(101L);
                    return situacion;
                });

        Long idRegistrado = servicio.registrar(
                solicitudValida(8L, 12L)
        );

        assertEquals(101L, idRegistrado);

        var captor = org.mockito.ArgumentCaptor.forClass(
                SituacionExcepcional.class
        );

        verify(situacionRepositorio).save(captor.capture());

        SituacionExcepcional guardada = captor.getValue();

        assertSame(examen, guardada.getExamen());
        assertSame(estudiante, guardada.getEstudiante());
        assertSame(administrador, guardada.getRegistradoPor());

        verify(consultaRepositorio).existeInscripcion(8L, 12L);
    }

    @Test
    void rechazaUsuarioQueNoEsEstudiante() {
        Usuario administrador = crearUsuario("ADMINISTRADOR");
        autenticar(5L, administrador, "ADMINISTRADOR");

        when(examenRepositorio.findById(8L))
                .thenReturn(Optional.of(mock(Examen.class)));

        Usuario docente = crearUsuario("DOCENTE");

        when(usuarioRepositorio.findById(12L))
                .thenReturn(Optional.of(docente));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> servicio.registrar(solicitudValida(8L, 12L))
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());

        verifyNoInteractions(consultaRepositorio);
        verifyNoInteractions(situacionRepositorio);
    }

    @Test
    void rechazaTipoSituacionVacio() {
        Usuario administrador = crearUsuario("ADMINISTRADOR");
        autenticar(5L, administrador, "ADMINISTRADOR");

        when(examenRepositorio.findById(8L))
                .thenReturn(Optional.of(mock(Examen.class)));

        var solicitud = new RegistrarSituacionExcepcionalSolicitud(
                8L,
                null,
                "   ",
                "Se produjo un corte de energia electrica",
                LocalDate.of(2026, 11, 19),
                LocalTime.of(10, 30)
        );

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> servicio.registrar(solicitud)
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());

        verifyNoInteractions(situacionRepositorio);
    }

    @Test
    void rechazaFechaOcurrenciaVacia() {
        Usuario administrador = crearUsuario("ADMINISTRADOR");
        autenticar(5L, administrador, "ADMINISTRADOR");

        when(examenRepositorio.findById(8L))
                .thenReturn(Optional.of(mock(Examen.class)));

        var solicitud = new RegistrarSituacionExcepcionalSolicitud(
                8L,
                null,
                "Interrupcion del examen",
                "Se produjo un corte de energia electrica",
                null,
                LocalTime.of(10, 30)
        );

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> servicio.registrar(solicitud)
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());

        verifyNoInteractions(situacionRepositorio);
    }

    @Test
    void rechazaHoraOcurrenciaVacia() {
        Usuario administrador = crearUsuario("ADMINISTRADOR");
        autenticar(5L, administrador, "ADMINISTRADOR");

        when(examenRepositorio.findById(8L))
                .thenReturn(Optional.of(mock(Examen.class)));

        var solicitud = new RegistrarSituacionExcepcionalSolicitud(
                8L,
                null,
                "Interrupcion del examen",
                "Se produjo un corte de energia electrica",
                LocalDate.of(2026, 11, 19),
                null
        );

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> servicio.registrar(solicitud)
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());

        verifyNoInteractions(situacionRepositorio);
    }

    @Test
    void historialIncluyeSituacionesSinEstudiante() {
        Examen examen = new Examen();
        examen.setIdExamen(8L);
        examen.setNombreExamen("Primer parcial");

        Usuario administrador = mock(Usuario.class);
        when(administrador.getNombre()).thenReturn("Carlos");
        when(administrador.getApellido()).thenReturn("Lopez");

        SituacionExcepcional situacion = new SituacionExcepcional();
        situacion.setIdSituacion(15L);
        situacion.setExamen(examen);
        situacion.setRegistradoPor(administrador);
        situacion.setTipoSituacion("Interrupcion");
        situacion.setFechaOcurrencia(LocalDate.of(2026, 11, 19));
        situacion.setHoraOcurrencia(LocalTime.of(10, 30));

        when(situacionRepositorio.buscarHistorial(null, null, null))
                .thenReturn(List.of(situacion));

        var resultado = servicio.listarHistorial(null, null, null);

        assertEquals(1, resultado.size());

        var resumen = resultado.get(0);

        assertEquals(15L, resumen.idSituacion());
        assertEquals(8L, resumen.idExamen());
        assertEquals("Primer parcial", resumen.nombreExamen());
        assertNull(resumen.idEstudiante());
        assertNull(resumen.nombreEstudiante());
        assertEquals("Interrupcion", resumen.tipoSituacion());
        assertEquals("Carlos Lopez", resumen.registradoPor());
        assertFalse(resumen.tieneEvidencia());

        verify(situacionRepositorio).buscarHistorial(null, null, null);
    }

    @Test
    void historialAplicaFiltrosCombinados() {
        when(situacionRepositorio.buscarHistorial(
                8L,
                12L,
                "Interrupcion"
        )).thenReturn(List.of());

        var resultado = servicio.listarHistorial(
                8L,
                12L,
                "  Interrupcion  "
        );

        assertTrue(resultado.isEmpty());

        verify(situacionRepositorio).buscarHistorial(
                8L,
                12L,
                "Interrupcion"
        );
    }

    @Test
    void historialRechazaIdentificadorInvalido() {
        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> servicio.listarHistorial(0L, null, null)
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());

        verifyNoInteractions(situacionRepositorio);
    }

    @Test
    void detalleDevuelveSituacionRegistrada() {
        Examen examen = new Examen();
        examen.setIdExamen(8L);
        examen.setNombreExamen("Primer parcial");

        Usuario administrador = mock(Usuario.class);
        when(administrador.getNombre()).thenReturn("Carlos");
        when(administrador.getApellido()).thenReturn("Lopez");

        SituacionExcepcional situacion = new SituacionExcepcional();
        situacion.setIdSituacion(15L);
        situacion.setExamen(examen);
        situacion.setRegistradoPor(administrador);
        situacion.setTipoSituacion("Interrupcion");
        situacion.setDescripcion("Corte de energia electrica");
        situacion.setFechaOcurrencia(LocalDate.of(2026, 11, 19));
        situacion.setHoraOcurrencia(LocalTime.of(10, 30));
        situacion.setEvidenciaReferencia("archivo-privado.pdf");

        when(situacionRepositorio.buscarDetalle(15L))
                .thenReturn(Optional.of(situacion));

        var resultado = servicio.obtenerDetalle(15L);

        assertEquals(15L, resultado.idSituacion());
        assertEquals(8L, resultado.idExamen());
        assertEquals("Primer parcial", resultado.nombreExamen());
        assertNull(resultado.idEstudiante());
        assertNull(resultado.nombreEstudiante());
        assertEquals("Interrupcion", resultado.tipoSituacion());
        assertEquals(
                "Corte de energia electrica",
                resultado.descripcion()
        );
        assertEquals("Carlos Lopez", resultado.registradoPor());
        assertTrue(resultado.tieneEvidencia());

        verify(situacionRepositorio).buscarDetalle(15L);
    }

    @Test
    void detalleInexistenteDevuelve404() {
        when(situacionRepositorio.buscarDetalle(99L))
                .thenReturn(Optional.empty());

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> servicio.obtenerDetalle(99L)
        );

        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());

        verify(situacionRepositorio).buscarDetalle(99L);
    }

    @Test
    void detalleRechazaIdentificadorInvalido() {
        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> servicio.obtenerDetalle(0L)
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());

        verifyNoInteractions(situacionRepositorio);
    }
}
