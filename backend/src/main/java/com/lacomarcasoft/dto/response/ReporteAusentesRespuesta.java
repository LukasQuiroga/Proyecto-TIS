package com.lacomarcasoft.dto.response;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record ReporteAusentesRespuesta(
        Long idExamen,
        String codigoExamen,
        String nombreExamen,
        String asignatura,
        LocalDate fechaExamen,
        LocalTime horaInicio,
        int totalAusentes,
        int totalAsistentes,
        int totalPadron,
        List<ReporteAsistenciaDetalleRespuesta> estudiantesAusentes
) {}
