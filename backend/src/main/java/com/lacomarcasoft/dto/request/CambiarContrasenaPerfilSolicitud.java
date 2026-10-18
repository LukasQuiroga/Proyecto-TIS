package com.lacomarcasoft.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CambiarContrasenaPerfilSolicitud(

    @NotBlank(message = "Debe ingresar su contraseña actual")
    String contrasenaActual,

    @NotBlank(message = "Debe ingresar una nueva contraseña")
    @Size(
        min = 8,
        max = 64,
        message = "La contraseña debe tener entre 8 y 64 caracteres"
    )
    String nuevaContrasena,

    @NotBlank(message = "Debe confirmar la nueva contraseña")
    String confirmarContrasena

) {}
