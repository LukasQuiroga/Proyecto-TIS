
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
import com.lacomarcasoft.dto.response.SituacionExcepcionalDetalleRespuesta;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

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
        @Test
    void historialRecibeFiltrosYDevuelve200() throws Exception {
        when(servicio.listarHistorial(8L, 12L, "Interrupcion"))
                .thenReturn(List.of());

        mvc.perform(get("/api/situaciones-excepcionales")
                .param("idExamen", "8")
                .param("idEstudiante", "12")
                .param("tipoSituacion", "Interrupcion"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));

        verify(servicio).listarHistorial(
                8L,
                12L,
                "Interrupcion"
        );
    }

    @Test
    void detalleExistenteDevuelve200() throws Exception {
        var respuesta = new SituacionExcepcionalDetalleRespuesta(
                15L,
                8L,
                "Primer parcial",
                null,
                null,
                "Interrupcion",
                "Corte de energia electrica",
                LocalDate.of(2026, 11, 19),
                LocalTime.of(10, 30),
                null,
                true,
                "Carlos Lopez"
        );

        when(servicio.obtenerDetalle(15L))
                .thenReturn(respuesta);

        mvc.perform(get("/api/situaciones-excepcionales/15"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idSituacion").value(15))
                .andExpect(jsonPath("$.nombreExamen").value("Primer parcial"))
                .andExpect(jsonPath("$.descripcion").value(
                        "Corte de energia electrica"
                ))
                .andExpect(jsonPath("$.tieneEvidencia").value(true));

        verify(servicio).obtenerDetalle(15L);
    }

    @Test
    void detalleInexistenteDevuelve404() throws Exception {
        when(servicio.obtenerDetalle(99L))
                .thenThrow(new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Situacion excepcional no encontrada"
                ));

        mvc.perform(get("/api/situaciones-excepcionales/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.mensaje").value(
                        "Situacion excepcional no encontrada"
                ));
    }
}
