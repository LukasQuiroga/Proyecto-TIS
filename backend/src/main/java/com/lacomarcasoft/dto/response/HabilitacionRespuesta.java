
package com.lacomarcasoft.dto.response;

import java.time.OffsetDateTime;

public record HabilitacionRespuesta(
    Long idExamen,
    String nombreExamen,
    Long idEstudiante,
    String codigoUniversitario,
    String nombreEstudiante,
    String estado,
    Long idMotivo,
    String tituloMotivo,
    String motivo,
    OffsetDateTime fechaCreacion,
    OffsetDateTime fechaActualizacion,
    Long idUsuarioResponsable,
    Long numeroCambios
) {}