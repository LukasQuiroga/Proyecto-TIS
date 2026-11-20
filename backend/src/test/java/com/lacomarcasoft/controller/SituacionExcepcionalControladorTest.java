
package com.lacomarcasoft.controller;

import com.lacomarcasoft.dto.request.RegistrarSituacionExcepcionalSolicitud;
import com.lacomarcasoft.exception.GlobalExceptionHandler;
import com.lacomarcasoft.service.SituacionExcepcionalServicio;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.server.ResponseStatusException;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class SituacionExcepcionalControladorTest {

    private SituacionExcepcionalServicio servicio;
    private MockMvc mvc;

    @BeforeEach
    void preparar() {
        servicio = mock(SituacionExcepcionalServicio.class);

        mvc = MockMvcBuilders.standaloneSetup(
                new SituacionExcepcionalControlador(servicio)
        ).setControllerAdvice(
                new GlobalExceptionHandler()
        ).build();
    }

    @Test
    void registroExitosoDevuelve201() throws Exception {
        when(servicio.registrar(
                any(RegistrarSituacionExcepcionalSolicitud.class)
        )).thenReturn(100L);

        mvc.perform(post("/api/situaciones-excepcionales")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "idExamen": 8,
                      "idEstudiante": null,
                      "tipoSituacion": "Interrupcion del examen",
                      "descripcion": "Corte de energia electrica",
                      "fechaOcurrencia": "2026-11-19",
                      "horaOcurrencia": "10:30:00"
                    }
                    """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.idSituacion").value(100))
                .andExpect(jsonPath("$.mensaje").value(
                        "Situacion excepcional registrada correctamente"
                ));

        verify(servicio).registrar(
                any(RegistrarSituacionExcepcionalSolicitud.class)
        );
    }

    @Test
    void descripcionInvalidaDevuelve400() throws Exception {
        when(servicio.registrar(
                any(RegistrarSituacionExcepcionalSolicitud.class)
        )).thenThrow(new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "La descripcion es obligatoria"
        ));

        mvc.perform(post("/api/situaciones-excepcionales")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "idExamen": 8,
                      "idEstudiante": null,
                      "tipoSituacion": "Interrupcion del examen",
                      "descripcion": "   ",
                      "fechaOcurrencia": "2026-11-19",
                      "horaOcurrencia": "10:30:00"
                    }
                    """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje").value(
                        "La descripcion es obligatoria"
                ));
    }
}
