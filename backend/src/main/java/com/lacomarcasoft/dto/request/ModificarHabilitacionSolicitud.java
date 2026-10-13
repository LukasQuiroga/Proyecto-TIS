
package com.lacomarcasoft.dto.request;

import jakarta.validation.constraints.*;

public record ModificarHabilitacionSolicitud(
    @NotNull(message = "Debe seleccionar un estudiante")
    Long idEstudiante,

    @NotBlank(message = "Debe seleccionar un estado")
    @Pattern(regexp = "HABILITADO|INHABILITADO", message = "Estado no válido")
    String estado,

    Long idMotivo,

    @NotNull(message = "Debe proporcionar el número de cambios actual")
    @Min(value = 0, message = "El número de cambios no puede ser negativo")
    Long numeroCambios
) {}