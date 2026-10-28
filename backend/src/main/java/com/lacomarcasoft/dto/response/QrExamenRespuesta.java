package com.lacomarcasoft.dto.response;

import java.time.OffsetDateTime;

public record QrExamenRespuesta(
        Long idQrExamen,
        Long idExamen,
        Long idEstudiante,
        String nombreEstudiante,
        String correo,
        String estadoEnvio,
        OffsetDateTime fechaCreacion,
        OffsetDateTime fechaEnvio,
        Integer intentosEnvio,
        String ultimoError,
        Boolean revocado
) {
}
