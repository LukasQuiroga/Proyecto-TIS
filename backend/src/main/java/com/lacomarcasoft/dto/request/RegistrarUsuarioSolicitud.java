package com.lacomarcasoft.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RegistrarUsuarioSolicitud(

        @NotBlank(message = "El nombre es obligatorio")
        String nombre,

        @NotBlank(message = "El apellido es obligatorio")
        String apellido,

        @NotBlank(message = "El carnet de identidad es obligatorio")
        String carnetIdentidad,

        @NotBlank(message = "El correo es obligatorio")
        @Email(message = "El correo electrónico no es válido")
        String correo,

        String contrasena,

        @NotNull(message = "Debe seleccionar un rol")
        Long idRol,

        Boolean activo,

        String celular,

        String codigoSis,

        String carrera

) {
}