package com.lacomarcasoft.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record RegistrarIngresoSolicitud(
    @NotNull(message = "Debe indicar el estudiante")
    @Positive(message = "El identificador del estudiante debe ser positivo")
    Long idEstudiante
) {}
