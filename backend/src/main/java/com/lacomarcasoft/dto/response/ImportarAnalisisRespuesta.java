package com.lacomarcasoft.dto.response;

import java.util.List;

public record ImportarAnalisisRespuesta(

        int total,

        int validos,

        int conErrores,

        List<FilaImportacionRespuesta> filas

) {
}