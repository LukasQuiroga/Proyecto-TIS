package com.lacomarcasoft.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public record ModificarHabilitacionMasivaSolicitud(
    @NotEmpty(message = "Debe seleccionar al menos un estudiante")
    @Size(max = 200, message = "No se permiten mas de 200 estudiantes por solicitud")
    List<@Valid ModificarHabilitacionSolicitud> estudiantes
) {}
