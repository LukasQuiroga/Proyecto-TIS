package com.lacomarcasoft.dto.response;

import java.util.List;

public record ImportarMasivoRespuesta(

        int total,

        int registrados,

        int conErrores,

        List<FilaImportacionRespuesta> filas

) {
}