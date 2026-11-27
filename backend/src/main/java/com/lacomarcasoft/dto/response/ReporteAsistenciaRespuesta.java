package com.lacomarcasoft.dto.response;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;

public record ReporteAsistenciaRespuesta(
        Long idReporte,
        Long idExamen,
        String nombreExamen,
        String asignatura,
        LocalDate fechaExamen,
        LocalTime horaInicio,
        OffsetDateTime fechaGeneracion,
        String nombreGenerador,
        int totalPadron,
        int totalAsistentes,
        int totalAusentes,
        List<ReporteAsistenciaDetalleRespuesta> estudiantes
) {}
