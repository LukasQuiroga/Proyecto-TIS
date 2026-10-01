package com.lacomarcasoft.dto.request;

import jakarta.validation.constraints.NotNull;

public record CambiarRolSolicitud(

        @NotNull(message = "Debe seleccionar un rol")
        Long idRol

) {
}