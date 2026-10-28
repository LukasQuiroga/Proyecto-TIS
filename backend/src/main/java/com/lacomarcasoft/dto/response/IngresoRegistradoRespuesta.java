package com.lacomarcasoft.dto.response;

import java.time.OffsetDateTime;

public record IngresoRegistradoRespuesta(
    Long idIngreso,
    String codigoUniversitario,
    String nombreEstudiante,
    String nombreExamen,
    String ambiente,
    OffsetDateTime fechaHoraIngreso,
    String estado
) {}
