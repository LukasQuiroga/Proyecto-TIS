package com.lacomarcasoft.dto.response;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;

public record ReporteHorariosHistorialRespuesta(
        Long idReporte,
        Long idExamen,
        String nombreExamen,
        String asignatura,
        LocalDate fechaExamen,
        LocalTime horaInicio,
        OffsetDateTime fechaGeneracion,
        String nombreGenerador,
        int totalIngresos
) {}