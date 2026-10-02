package com.lacomarcasoft.dto.response;

import java.util.List;

public record ErroresRegistroRespuesta(

        List<CampoError> errores

) {
}