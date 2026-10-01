package com.lacomarcasoft.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegistrarLogSolicitud(

        Long idUsuario,

        @NotBlank(message = "El tipo de acción es obligatorio")
        @Size(
                max = 50,
                message = "El tipo de acción no debe superar 50 caracteres"
        )
        String tipoAccion,

        @NotBlank(message = "La descripción es obligatoria")
        String descripcion,

        String ipOrigen,

        Boolean exitosa

) {
}