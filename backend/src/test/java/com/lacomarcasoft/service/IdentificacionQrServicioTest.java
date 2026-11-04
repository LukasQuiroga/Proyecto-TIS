
package com.lacomarcasoft.service;

import com.lacomarcasoft.modelo.Examen;
import com.lacomarcasoft.modelo.Materia;
import com.lacomarcasoft.modelo.QrExamenEstudiante;
import com.lacomarcasoft.modelo.Usuario;
import com.lacomarcasoft.repository.QrExamenEstudianteRepositorio;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Answers;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class IdentificacionQrServicioTest {

    private static final Long ID_EXAMEN = 10L;
    private static final Long ID_ESTUDIANTE = 25L;
    private static final Long ID_MATERIA = 3L;
    private static final String TOKEN = "token-cifrado-de-prueba";
    private static final String HASH = "hash-de-prueba";

    private QrExamenEstudianteRepositorio qrRepositorio;
    private QrExamenServicio qrExamenServicio;
    private AccesoExamenDocenteServicio accesoExamenDocente;
    private JdbcTemplate jdbc;
    private IdentificacionQrServicio servicio;

    private QrExamenEstudiante qr;
    private Usuario estudiante;

    @BeforeEach
    void preparar() {
        qrRepositorio = mock(QrExamenEstudianteRepositorio.class);
        qrExamenServicio = mock(QrExamenServicio.class);
        accesoExamenDocente = mock(AccesoExamenDocenteServicio.class);
        jdbc = mock(JdbcTemplate.class);

        servicio = new IdentificacionQrServicio(
                qrRepositorio,
                qrExamenServicio,
                accesoExamenDocente,
                jdbc
        );

        Examen examen = new Examen();
        examen.setIdExamen(ID_EXAMEN);

        Materia materia = new Materia();
        materia.setIdMateria(ID_MATERIA);

        estudiante = mock(Usuario.class, Answers.RETURNS_DEEP_STUBS);

        when(estudiante.getIdUsuario()).thenReturn(ID_ESTUDIANTE);
        when(estudiante.getActivo()).thenReturn(true);
        when(estudiante.getRol().getNombreRol()).thenReturn("ESTUDIANTE");
        when(estudiante.getNombre()).thenReturn("Ana");
        when(estudiante.getApellido()).thenReturn("Perez");
        when(estudiante.getCarnetIdentidad()).thenReturn("12345678");
        when(estudiante.getCodigoSis()).thenReturn("202012345");
        when(estudiante.getCelular()).thenReturn("70000000");
        when(estudiante.getFotoPerfil()).thenReturn("foto.jpg");

        qr = mock(QrExamenEstudiante.class);

        when(qr.getRevocado()).thenReturn(false);
        when(qr.getExamen()).thenReturn(examen);
        when(qr.getMateria()).thenReturn(materia);
        when(qr.getEstudiante()).thenReturn(estudiante);
        when(qr.getTokenCifrado()).thenReturn(TOKEN);

        when(qrExamenServicio.calcularHash(TOKEN)).thenReturn(HASH);

        when(qrRepositorio.findByTokenHash(HASH))
                .thenReturn(Optional.of(qr));

        when(qrExamenServicio.leerContenido(TOKEN))
                .thenReturn(contenidoValido());

        when(jdbc.queryForObject(
                anyString(),
                eq(Boolean.class),
                eq(ID_EXAMEN),
                eq(ID_ESTUDIANTE)
        )).thenReturn(true);
    }

    private QrExamenServicio.ContenidoQrExamen contenidoValido() {
        return new QrExamenServicio.ContenidoQrExamen(
                1,
                ID_EXAMEN,
                ID_ESTUDIANTE,
                ID_MATERIA,
                "nonce-valido"
        );
    }

    private void comprobarError(
            HttpStatus estado,
            Long idExamen,
            String token) {

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> servicio.identificar(idExamen, token)
        );

        assertEquals(estado, error.getStatusCode());
    }

    @Test
    void debeIdentificarEstudianteConQrValido() {
        ConsultaIngresoServicio.EstudianteIdentificado resultado =
                servicio.identificar(ID_EXAMEN, TOKEN);

        assertEquals(ID_EXAMEN, resultado.idExamen());
        assertEquals(ID_ESTUDIANTE, resultado.idEstudiante());
        assertEquals("Ana Perez", resultado.nombreEstudiante());
        assertEquals("12345678", resultado.documentoIdentidad());
        assertEquals("202012345", resultado.codigoUniversitario());
        assertEquals("70000000", resultado.telefono());
        assertTrue(resultado.asociadoAlExamen());
        assertTrue(resultado.tieneFoto());

        verify(accesoExamenDocente)
                .verificarExamenActual(ID_EXAMEN);

        verify(qrRepositorio).findByTokenHash(HASH);

        verify(jdbc).queryForObject(
                anyString(),
                eq(Boolean.class),
                eq(ID_EXAMEN),
                eq(ID_ESTUDIANTE)
        );
    }

    @Test
    void debeInformarEstudianteNoAsociadoAlExamen() {
        when(jdbc.queryForObject(
                anyString(),
                eq(Boolean.class),
                eq(ID_EXAMEN),
                eq(ID_ESTUDIANTE)
        )).thenReturn(false);

        ConsultaIngresoServicio.EstudianteIdentificado resultado =
                servicio.identificar(ID_EXAMEN, TOKEN);

        assertEquals(ID_ESTUDIANTE, resultado.idEstudiante());
        assertFalse(resultado.asociadoAlExamen());
    }

    @Test
    void debeRechazarIdentificadorDeExamenInvalido() {
        for (Long id : new Long[]{null, 0L, -1L}) {
            comprobarError(HttpStatus.BAD_REQUEST, id, TOKEN);
        }

        verifyNoInteractions(
                accesoExamenDocente,
                qrRepositorio,
                qrExamenServicio,
                jdbc
        );
    }

    @Test
    void debeRechazarTokenVacio() {
        for (String token : new String[]{null, "", "   "}) {
            comprobarError(HttpStatus.BAD_REQUEST, ID_EXAMEN, token);
        }

        verifyNoInteractions(
                accesoExamenDocente,
                qrRepositorio,
                qrExamenServicio,
                jdbc
        );
    }

    @Test
    void debeRechazarTokenDemasiadoLargo() {
        comprobarError(
                HttpStatus.BAD_REQUEST,
                ID_EXAMEN,
                "A".repeat(8193)
        );

        verifyNoInteractions(
                accesoExamenDocente,
                qrRepositorio,
                qrExamenServicio,
                jdbc
        );
    }

    @Test
    void debeEliminarEspaciosExternosDelToken() {
        ConsultaIngresoServicio.EstudianteIdentificado resultado =
                servicio.identificar(
                        ID_EXAMEN,
                        "  " + TOKEN + "  "
                );

        assertEquals(ID_ESTUDIANTE, resultado.idEstudiante());

        verify(qrExamenServicio).calcularHash(TOKEN);
        verify(qrExamenServicio).leerContenido(TOKEN);
    }

    @Test
    void debeRechazarUsuarioSinPermiso() {
        doThrow(new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Acceso no autorizado"
        ))
        .when(accesoExamenDocente)
        .verificarExamenActual(ID_EXAMEN);

        comprobarError(HttpStatus.FORBIDDEN, ID_EXAMEN, TOKEN);

        verifyNoInteractions(qrRepositorio, qrExamenServicio, jdbc);
    }

    @Test
    void debeInformarQrNoRegistrado() {
        when(qrRepositorio.findByTokenHash(HASH))
                .thenReturn(Optional.empty());

        comprobarError(HttpStatus.NOT_FOUND, ID_EXAMEN, TOKEN);

        verify(qrExamenServicio, never())
                .leerContenido(anyString());

        verifyNoInteractions(jdbc);
    }

    @Test
    void debeRechazarQrRevocado() {
        when(qr.getRevocado()).thenReturn(true);

        comprobarError(HttpStatus.CONFLICT, ID_EXAMEN, TOKEN);

        verifyNoInteractions(jdbc);
    }

    @Test
    void debeRechazarQrDeOtroExamen() {
        Examen otroExamen = new Examen();
        otroExamen.setIdExamen(99L);

        when(qr.getExamen()).thenReturn(otroExamen);

        comprobarError(HttpStatus.CONFLICT, ID_EXAMEN, TOKEN);

        verifyNoInteractions(jdbc);
    }

    @Test
    void debeRechazarTokenDiferenteAlAlmacenado() {
        when(qr.getTokenCifrado()).thenReturn("otro-token");

        comprobarError(HttpStatus.BAD_REQUEST, ID_EXAMEN, TOKEN);

        verify(qrExamenServicio, never())
                .leerContenido(anyString());

        verifyNoInteractions(jdbc);
    }

    @Test
    void debeRechazarContenidoQrNoDescifrable() {
        when(qrExamenServicio.leerContenido(TOKEN))
                .thenThrow(new IllegalStateException(
                        "Contenido cifrado invalido"
                ));

        comprobarError(HttpStatus.BAD_REQUEST, ID_EXAMEN, TOKEN);

        verifyNoInteractions(jdbc);
    }

    @Test
    void debeRechazarDatosInconsistentesDelQr() {
        List<QrExamenServicio.ContenidoQrExamen> contenidos =
                List.of(
                        new QrExamenServicio.ContenidoQrExamen(
                                2,
                                ID_EXAMEN,
                                ID_ESTUDIANTE,
                                ID_MATERIA,
                                "nonce"
                        ),
                        new QrExamenServicio.ContenidoQrExamen(
                                1,
                                99L,
                                ID_ESTUDIANTE,
                                ID_MATERIA,
                                "nonce"
                        ),
                        new QrExamenServicio.ContenidoQrExamen(
                                1,
                                ID_EXAMEN,
                                99L,
                                ID_MATERIA,
                                "nonce"
                        ),
                        new QrExamenServicio.ContenidoQrExamen(
                                1,
                                ID_EXAMEN,
                                ID_ESTUDIANTE,
                                99L,
                                "nonce"
                        ),
                        new QrExamenServicio.ContenidoQrExamen(
                                1,
                                ID_EXAMEN,
                                ID_ESTUDIANTE,
                                ID_MATERIA,
                                "   "
                        )
                );

        for (QrExamenServicio.ContenidoQrExamen contenido : contenidos) {
            when(qrExamenServicio.leerContenido(TOKEN))
                    .thenReturn(contenido);

            comprobarError(
                    HttpStatus.BAD_REQUEST,
                    ID_EXAMEN,
                    TOKEN
            );
        }

        verifyNoInteractions(jdbc);
    }

    @Test
    void debeRechazarEstudianteInactivo() {
        when(estudiante.getActivo()).thenReturn(false);

        comprobarError(HttpStatus.NOT_FOUND, ID_EXAMEN, TOKEN);

        verifyNoInteractions(jdbc);
    }

    @Test
    void debeRechazarUsuarioQueNoEsEstudiante() {
        when(estudiante.getRol().getNombreRol())
                .thenReturn("DOCENTE");

        comprobarError(HttpStatus.NOT_FOUND, ID_EXAMEN, TOKEN);

        verifyNoInteractions(jdbc);
    }

    @Test
    void debePropagarErrorDeConexionConBaseDeDatos() {
        when(jdbc.queryForObject(
                anyString(),
                eq(Boolean.class),
                eq(ID_EXAMEN),
                eq(ID_ESTUDIANTE)
        )).thenThrow(
                new DataAccessResourceFailureException(
                        "Sin conexion con la base de datos"
                )
        );

        assertThrows(
                DataAccessResourceFailureException.class,
                () -> servicio.identificar(ID_EXAMEN, TOKEN)
        );
    }

    @Test
    void debePermitirConsultarNuevamenteElMismoQr() {
        ConsultaIngresoServicio.EstudianteIdentificado primero =
                servicio.identificar(ID_EXAMEN, TOKEN);

        ConsultaIngresoServicio.EstudianteIdentificado segundo =
                servicio.identificar(ID_EXAMEN, TOKEN);

        assertEquals(primero.idEstudiante(), segundo.idEstudiante());

        verify(qrRepositorio, times(2))
                .findByTokenHash(HASH);
    }
}
