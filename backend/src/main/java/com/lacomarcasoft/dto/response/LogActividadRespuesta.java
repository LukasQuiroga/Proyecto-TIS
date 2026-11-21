package com.lacomarcasoft.dto.response;

import java.time.OffsetDateTime;

public record LogActividadRespuesta(

        Long idLog,

        Long idUsuario,

        String nombreUsuario,

        String rol,

        String tipoAccion,

        String descripcion,

        String modulo,

        String ipOrigen,

        OffsetDateTime fecha,

        Boolean exitosa

) {
}