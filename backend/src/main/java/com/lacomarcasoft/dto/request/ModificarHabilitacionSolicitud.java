package com.lacomarcasoft.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record ModificarHabilitacionSolicitud(
    @NotNull(message = "Debe seleccionar un estudiante")
    Long idEstudiante,

    @NotBlank(message = "Debe seleccionar un estado")
    @Pattern(
        regexp = "HABILITADO|INHABILITADO",
        message = "Estado no valido"
    )
    String estado,

    @Size(max = 120, message = "El titulo no puede superar 120 caracteres")
    String titulo,

    @Size(max = 500, message = "El motivo no puede superar 500 caracteres")
    String motivo,

    @Positive(message = "El identificador del motivo debe ser positivo")
    Long idMotivo,

    @NotNull(message = "Debe proporcionar el numero de cambios actual")
    @Min(value = 0, message = "El numero de cambios no puede ser negativo")
    Long numeroCambios
) {}
