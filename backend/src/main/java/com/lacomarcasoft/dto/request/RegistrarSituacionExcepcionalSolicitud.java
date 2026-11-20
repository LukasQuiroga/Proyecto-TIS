
package com.lacomarcasoft.dto.request;

import java.time.LocalDate;
import java.time.LocalTime;

public record RegistrarSituacionExcepcionalSolicitud(
        Long idExamen,
        Long idEstudiante,
        String tipoSituacion,
        String descripcion,
        LocalDate fechaOcurrencia,
        LocalTime horaOcurrencia
) {
}
