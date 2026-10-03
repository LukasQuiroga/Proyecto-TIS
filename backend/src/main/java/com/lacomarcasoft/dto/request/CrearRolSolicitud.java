package com.lacomarcasoft.dto.request;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CrearRolSolicitud(
        @Size(
                max = 50,
                message = "El nombre del rol no puede superar los 50 caracteres."
        )
        @Pattern(
                regexp = "^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$",
                message = "El nombre del rol solo puede contener letras y espacios."
        )
        String nombreRol,
        String descripcionRol,
        List<Long> permisos
) {
}
