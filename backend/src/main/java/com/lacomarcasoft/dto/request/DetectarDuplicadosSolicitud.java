package com.lacomarcasoft.dto.request;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record DetectarDuplicadosSolicitud(

        @NotEmpty(message = "Debe enviar al menos un código SIS")
        List<String> codigosSis

) {
}