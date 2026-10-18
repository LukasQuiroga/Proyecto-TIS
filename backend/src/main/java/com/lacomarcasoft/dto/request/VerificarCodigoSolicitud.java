package com.lacomarcasoft.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record VerificarCodigoSolicitud(
        @NotBlank(message = "El correo electrónico es obligatorio")
        @Email(message = "Debe ingresar un correo electrónico válido")
        String correo,

        @NotBlank(message = "El código de verificación es obligatorio")
        @Pattern(regexp = "\\d{6}", message = "El código debe contener 6 dígitos")
        String codigo
) {
}