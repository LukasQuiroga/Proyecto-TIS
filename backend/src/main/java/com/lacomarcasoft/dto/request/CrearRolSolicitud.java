package com.lacomarcasoft.dto.request;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CrearRolSolicitud(
        @Size(
                max = 50,
                message = "El nombre del rol no puede superar los 50 caracteres."
        )
        String nombreRol,
        String descripcionRol,
        List<Long> permisos
) {
}
