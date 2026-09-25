package com.lacomarcasoft.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RestablecerContrasenaSolicitud(
        @NotBlank(message = "El correo electrónico es obligatorio")
        @Email(message = "Debe ingresar un correo electrónico válido")
        String correo,

        @NotBlank(message = "El token de recuperación es obligatorio")
        String token,

        @NotBlank(message = "La nueva contraseña es obligatoria")
        @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
        @Pattern(
                regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$",
                message = "La contraseña debe combinar letras y números"
        )
        String nuevaContrasena,

        @NotBlank(message = "Debe confirmar la nueva contraseña")
        String confirmarContrasena
) {
}
