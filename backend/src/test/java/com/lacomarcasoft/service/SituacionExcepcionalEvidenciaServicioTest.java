
package com.lacomarcasoft.service;

import com.lacomarcasoft.modelo.SituacionExcepcional;
import com.lacomarcasoft.repository.SituacionExcepcionalRepositorio;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class SituacionExcepcionalEvidenciaServicioTest {

    private SituacionExcepcionalRepositorio repositorio;
    private AlmacenamientoEvidenciaServicio almacenamiento;
    private SituacionExcepcionalEvidenciaServicio servicio;
    private MockMultipartFile archivo;

    @BeforeEach
    void preparar() {
        repositorio = mock(SituacionExcepcionalRepositorio.class);
        almacenamiento = mock(AlmacenamientoEvidenciaServicio.class);

        servicio = new SituacionExcepcionalEvidenciaServicio(
                repositorio,
                almacenamiento
        );

        archivo = new MockMultipartFile(
                "archivo",
                "prueba.pdf",
                "application/pdf",
                "%PDF-1.7".getBytes()
        );

        var autenticacion = new UsernamePasswordAuthenticationToken(
                "admin@ejemplo.com",
                null,
                List.of(new SimpleGrantedAuthority(
                        "ROLE_ADMINISTRADOR"
                ))
        );

        autenticacion.setDetails(5L);

        SecurityContextHolder.getContext()
                .setAuthentication(autenticacion);
    }

    @AfterEach
    void limpiar() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void adjuntaEvidenciaCorrectamente() {
        SituacionExcepcional situacion = new SituacionExcepcional();
        situacion.setIdSituacion(15L);

        String referencia = "situaciones/15/archivo.pdf";

        when(repositorio.bloquearParaAdjuntar(15L))
                .thenReturn(Optional.of(situacion));

        when(almacenamiento.guardar(15L, archivo))
                .thenReturn(referencia);

        servicio.adjuntar(15L, archivo);

        assertEquals(
                referencia,
                situacion.getEvidenciaReferencia()
        );

        verify(repositorio).saveAndFlush(situacion);
    }

    @Test
    void rechazaEvidenciaDuplicada() {
        SituacionExcepcional situacion = new SituacionExcepcional();
        situacion.setEvidenciaReferencia("situaciones/15/existente.pdf");

        when(repositorio.bloquearParaAdjuntar(15L))
                .thenReturn(Optional.of(situacion));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> servicio.adjuntar(15L, archivo)
        );

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());

        verifyNoInteractions(almacenamiento);
    }

    @Test
    void rechazaSituacionInexistente() {
        when(repositorio.bloquearParaAdjuntar(99L))
                .thenReturn(Optional.empty());

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> servicio.adjuntar(99L, archivo)
        );

        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());

        verifyNoInteractions(almacenamiento);
    }

    @Test
    void rechazaIdentificadorInvalido() {
        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> servicio.adjuntar(0L, archivo)
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());

        verifyNoInteractions(repositorio, almacenamiento);
    }

    @Test
    void permiteDescargarEvidenciaExistente() {
        SituacionExcepcional situacion = new SituacionExcepcional();
        situacion.setEvidenciaReferencia("situaciones/15/archivo.pdf");

        when(repositorio.findById(15L))
                .thenReturn(Optional.of(situacion));

        var descargada = new AlmacenamientoEvidenciaServicio.Archivo(
                new ByteArrayResource(new byte[]{1, 2, 3}),
                "application/pdf",
                ".pdf"
        );

        when(almacenamiento.consultar(
                15L,
                "situaciones/15/archivo.pdf"
        )).thenReturn(descargada);

        assertSame(descargada, servicio.descargar(15L));
    }

    @Test
    void rechazaDescargaSinAutorizacion() {
        SecurityContextHolder.clearContext();

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> servicio.descargar(15L)
        );

        assertEquals(HttpStatus.UNAUTHORIZED, error.getStatusCode());

        verifyNoInteractions(repositorio, almacenamiento);
    }
}
