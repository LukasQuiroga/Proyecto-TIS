
package com.lacomarcasoft.dto.response;

import java.time.OffsetDateTime;

public record HistorialExpulsionRespuesta(
    Long idExpulsion,
    Long idEstudiante,
    String nombreCompleto,
    String codigoUniversitario,
    Long idResponsable,
    OffsetDateTime fechaHoraExpulsion,
    OffsetDateTime fechaHoraRegistro,
    String motivo,
    String observaciones
) {
}
