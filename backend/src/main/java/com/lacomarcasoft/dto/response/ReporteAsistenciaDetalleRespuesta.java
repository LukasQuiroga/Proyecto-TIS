package com.lacomarcasoft.dto.response;

import java.time.OffsetDateTime;

public record ReporteAsistenciaDetalleRespuesta(
        Long idEstudiante,
        String codigoEstudiante,
        String nombreCompleto,
        String estadoAsistencia,
        OffsetDateTime fechaHoraIngreso
) {}
