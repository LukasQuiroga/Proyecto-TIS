package com.lacomarcasoft.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record RestablecerContrasenaSolicitud(

        @NotBlank(message = "El correo electrónico es obligatorio")
        @Email(message = "Debe ingresar un correo electrónico válido")
        String correo,


        @NotBlank(message = "El token de recuperación es obligatorio")
        String token,


        @NotBlank(message = "La nueva contraseña es obligatoria")
        String nuevaContrasena,


        @NotBlank(message = "Debe confirmar la nueva contraseña")
        String confirmarContrasena

) {

}
