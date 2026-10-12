package com.lacomarcasoft.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ActualizarAmbienteSolicitud(

        @NotBlank(message = "El codigo del ambiente es obligatorio")
        @Size(max = 30, message = "El codigo no puede superar 30 caracteres")
        @Pattern(
                regexp = "^[A-Za-z0-9_-]+$",
                message = "El codigo solo puede contener letras, numeros, guion o guion bajo"
        )
        String codigo,

        @NotBlank(message = "El nombre del ambiente es obligatorio")
        @Size(
                min = 3,
                max = 100,
                message = "El nombre debe tener entre 3 y 100 caracteres"
        )
        String nombre,

        @NotNull(message = "La capacidad es obligatoria")
        @Min(value = 1, message = "La capacidad debe ser mayor a 0")
        Integer capacidad,

        @NotBlank(message = "La ubicacion es obligatoria")
        @Size(
                min = 3,
                max = 150,
                message = "La ubicacion debe tener entre 3 y 150 caracteres"
        )
        String ubicacion,

        @NotNull(message = "El estado del ambiente es obligatorio")
        Boolean disponible
) {
}