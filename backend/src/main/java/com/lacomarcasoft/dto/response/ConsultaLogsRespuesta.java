package com.lacomarcasoft.dto.response;

import java.util.List;

public record ConsultaLogsRespuesta(

        List<LogActividadRespuesta> logs,

        long total,

        int pagina,

        int tamanio,

        int totalPaginas

) {
}