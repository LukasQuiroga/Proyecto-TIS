package com.lacomarcasoft.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ActualizarIngresoSolicitud(
    @NotBlank(message = "El estado es obligatorio")
    String estado,
    @Size(max = 200, message = "El motivo no debe exceder 200 caracteres")
    String motivo
) {}
