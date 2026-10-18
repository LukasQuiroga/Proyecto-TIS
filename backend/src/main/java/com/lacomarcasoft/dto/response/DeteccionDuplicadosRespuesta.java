package com.lacomarcasoft.dto.response;

import java.util.List;

public record DeteccionDuplicadosRespuesta(

        List<String> yaRegistrados,

        List<String> repetidosEnEnvio

) {
}