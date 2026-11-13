package com.lacomarcasoft.dto.response;

import java.time.OffsetDateTime;

public record EstadoIngresoRespuesta(
    Long idExamen,
    Long idEstudiante,
    boolean ingresoRegistrado,
    Long idIngreso,
    OffsetDateTime fechaHoraIngreso,
    Long idResponsable,
    String mensaje
) {}
