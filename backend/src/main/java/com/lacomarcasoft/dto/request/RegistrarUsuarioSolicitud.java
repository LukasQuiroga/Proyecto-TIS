package com.lacomarcasoft.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegistrarUsuarioSolicitud(

        @NotBlank(message = "El nombre es obligatorio")
        String nombre,

        @NotBlank(message = "El apellido es obligatorio")
        String apellido,

        @NotBlank(message = "El correo es obligatorio")
        @Email(message = "El correo electrónico no es válido")
        String correo,

        @NotBlank(message = "La contraseña es obligatoria")
        @Size(
                min = 8,
                message = "La contraseña debe tener al menos 8 caracteres"
        )
        String contrasena,

        @NotNull(message = "Debe seleccionar un rol")
        Long idRol,

        @NotNull(message = "Debe seleccionar el estado")
        Boolean activo

) {
}