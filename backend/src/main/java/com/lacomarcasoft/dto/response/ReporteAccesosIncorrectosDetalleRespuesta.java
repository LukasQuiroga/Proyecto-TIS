package com.lacomarcasoft.dto.response;

import java.time.OffsetDateTime;

public record ReporteAccesosIncorrectosDetalleRespuesta(
        Long idIntento,
        Long idEstudiante,
        String codigoEstudiante,
        String nombreCompleto,
        String carrera,
        String identificadorIntentado,
        String metodoIdentificacion,
        String motivoRechazo,
        OffsetDateTime fechaHora) {
}
