package com.lacomarcasoft.dto.response;

public record DisponibilidadAmbienteRespuesta(
        Long idAmbiente,
        Boolean disponible,
        String mensaje
) {
}