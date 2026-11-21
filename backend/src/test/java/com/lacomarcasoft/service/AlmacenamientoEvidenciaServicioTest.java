
package com.lacomarcasoft.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;

class AlmacenamientoEvidenciaServicioTest {

    private AlmacenamientoEvidenciaServicio servicio;

    @BeforeEach
    void preparar() {
        servicio = new AlmacenamientoEvidenciaServicio(
                "https://ejemplo.supabase.co",
                "evidencias-situaciones",
                "clave-de-prueba"
        );
    }

    @Test
    void rechazaContenidoQueNoCorrespondeAlFormato() {
        var archivo = new MockMultipartFile(
                "archivo",
                "evidencia.pdf",
                "application/pdf",
                "contenido invalido".getBytes()
        );

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> servicio.guardar(15L, archivo)
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
    }

    @Test
    void rechazaArchivoVacio() {
        var archivo = new MockMultipartFile(
                "archivo",
                "evidencia.pdf",
                "application/pdf",
                new byte[0]
        );

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> servicio.guardar(15L, archivo)
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
    }
}
