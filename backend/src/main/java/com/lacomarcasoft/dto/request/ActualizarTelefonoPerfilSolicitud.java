package com.lacomarcasoft.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ActualizarTelefonoPerfilSolicitud(

    @NotBlank(message = "El teléfono es obligatorio")
    @Size(
        max = 30,
        message = "El teléfono no puede superar 30 caracteres"
    )
    @Pattern(
        regexp = "^\\+?[0-9][0-9\\s-]{6,28}$",
        message = "Ingrese un número de teléfono válido"
    )
    String celular

) {}
