package com.lacomarcasoft.dto.response;

import java.time.OffsetDateTime;

public record AmbienteRespuesta(
        Long idAmbiente,
        String codigo,
        String nombre,
        Integer capacidad,
        String ubicacion,
        Boolean disponible,
        OffsetDateTime fechaCreacion,
        OffsetDateTime fechaActualizacion
) {
}