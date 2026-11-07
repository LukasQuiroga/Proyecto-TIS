package com.lacomarcasoft.dto.response;

public record CorrespondenciaExamenRespuesta(
        Long idExamen,
        Long idEstudiante,
        boolean corresponde,
        boolean puedeContinuar,
        String mensaje
) {
}
