
package com.lacomarcasoft.controller;

import com.lacomarcasoft.exception.GlobalExceptionHandler;
import com.lacomarcasoft.service.AlmacenamientoEvidenciaServicio;
import com.lacomarcasoft.service.SituacionExcepcionalEvidenciaServicio;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class SituacionExcepcionalEvidenciaControladorTest {

    private SituacionExcepcionalEvidenciaServicio servicio;
    private MockMvc mvc;

    @BeforeEach
    void preparar() {
        servicio = mock(SituacionExcepcionalEvidenciaServicio.class);

        mvc = MockMvcBuilders.standaloneSetup(
                new SituacionExcepcionalEvidenciaControlador(servicio)
        ).setControllerAdvice(
                new GlobalExceptionHandler()
        ).build();
    }

    @Test
    void subidaExitosaDevuelve201() throws Exception {
        var archivo = new MockMultipartFile(
                "archivo",
                "evidencia.pdf",
                "application/pdf",
                "%PDF-1.7".getBytes()
        );

        mvc.perform(multipart(
                "/api/situaciones-excepcionales/15/evidencia"
        ).file(archivo))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.mensaje").value(
                        "Evidencia adjuntada correctamente"
                ));

        verify(servicio).adjuntar(eq(15L), any());
    }

    @Test
    void descargaDevuelveArchivoAdjunto() throws Exception {
        var archivo = new AlmacenamientoEvidenciaServicio.Archivo(
                new ByteArrayResource(new byte[]{1, 2, 3}),
                "application/pdf",
                ".pdf"
        );

        when(servicio.descargar(15L)).thenReturn(archivo);

        mvc.perform(get(
                "/api/situaciones-excepcionales/15/evidencia"
        ))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/pdf"))
                .andExpect(content().bytes(new byte[]{1, 2, 3}))
                .andExpect(header().string(
                        HttpHeaders.CONTENT_DISPOSITION,
                        containsString("attachment")
                ));

        verify(servicio).descargar(15L);
    }
}
