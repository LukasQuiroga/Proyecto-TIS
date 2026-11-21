
package com.lacomarcasoft.dto.response;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;

public record SituacionExcepcionalResumenRespuesta(
        Long idSituacion,
        Long idExamen,
        String nombreExamen,
        Long idEstudiante,
        String nombreEstudiante,
        String tipoSituacion,
        LocalDate fechaOcurrencia,
        LocalTime horaOcurrencia,
        OffsetDateTime fechaRegistro,
        boolean tieneEvidencia,
        String registradoPor
) {
}
