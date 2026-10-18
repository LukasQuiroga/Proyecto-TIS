package com.lacomarcasoft.dto.response;

import java.util.List;

public record FilaImportacionRespuesta(

        int fila,

        String documento,

        String nombres,

        String apellidos,

        String correo,

        String telefono,

        String rol,

        String estado,

        String codigoSis,

        List<String> carreras,

        List<String> observaciones

) {
}
