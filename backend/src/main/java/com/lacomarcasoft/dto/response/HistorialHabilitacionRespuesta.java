package com.lacomarcasoft.dto.response;

import java.time.OffsetDateTime;

public record HistorialHabilitacionRespuesta(
    Long idLog,
    Long idUsuarioResponsable,
    String nombreResponsable,
    String descripcion,
    OffsetDateTime fecha
) {}
