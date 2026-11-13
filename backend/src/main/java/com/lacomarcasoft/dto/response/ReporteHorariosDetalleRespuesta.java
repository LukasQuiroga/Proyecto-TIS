package com.lacomarcasoft.dto.response;

import java.time.OffsetDateTime;

public record ReporteHorariosDetalleRespuesta(
        Long idEstudiante,
        String codigoEstudiante,
        String nombreCompleto,
        OffsetDateTime fechaHoraIngreso
) {}