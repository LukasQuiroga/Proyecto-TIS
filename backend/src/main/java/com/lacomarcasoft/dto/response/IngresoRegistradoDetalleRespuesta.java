package com.lacomarcasoft.dto.response;

import java.time.OffsetDateTime;

public record IngresoRegistradoDetalleRespuesta(
    Long idIngreso,
    Long idExamen,
    Long idEstudiante,
    String codigoUniversitario,
    String nombreEstudiante,
    String nombreExamen,
    String ambiente,
    OffsetDateTime fechaHoraIngreso,
    OffsetDateTime fechaHoraSalida,
    String estado,
    String motivoSuspension,
    String motivoReincorporacion
) {}
