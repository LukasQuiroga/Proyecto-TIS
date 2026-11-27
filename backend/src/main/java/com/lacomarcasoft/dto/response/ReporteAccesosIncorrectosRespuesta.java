package com.lacomarcasoft.dto.response;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;

public record ReporteAccesosIncorrectosRespuesta(
        Long idReporte,
        Long idExamen,
        String nombreExamen,
        String asignatura,
        LocalDate fechaExamen,
        LocalTime horaInicio,
        OffsetDateTime fechaGeneracion,
        String nombreGenerador,
        int totalRechazados,
        int totalIngresosAutorizados,
        int totalPadron,
        List<ReporteAccesosIncorrectosDetalleRespuesta> intentos) {
}
