
package com.lacomarcasoft.dto.response;

import java.time.OffsetDateTime;

public record ExpulsionRegistradaRespuesta(
    Long idExpulsion,
    Long idExamen,
    Long idEstudiante,
    OffsetDateTime fechaHoraExpulsion,
    String motivo,
    String observaciones
) {
}
