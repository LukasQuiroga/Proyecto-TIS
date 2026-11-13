package com.lacomarcasoft.dto.response;

import java.time.LocalDate;
import java.time.LocalTime;

public record ReporteAsistenciaExamenRespuesta(
        Long idExamen,
        String codigoExamen,
        String nombreExamen,
        String asignatura,
        LocalDate fechaExamen,
        LocalTime horaInicio
) {}
