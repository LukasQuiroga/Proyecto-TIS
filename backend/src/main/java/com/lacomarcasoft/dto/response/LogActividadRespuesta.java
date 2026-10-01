package com.lacomarcasoft.dto.response;

import java.time.OffsetDateTime;

public record LogActividadRespuesta(

        Long idLog,

        Long idUsuario,

        String nombreUsuario,

        String tipoAccion,

        String descripcion,

        String ipOrigen,

        OffsetDateTime fecha,

        Boolean exitosa

) {
}