package com.lacomarcasoft.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ActualizarDocumentoPerfilSolicitud(
    @Size(max = 30, message = "El documento no puede superar 30 caracteres")
    @Pattern(regexp = "^[0-9]*$", message = "El documento debe contener solo números")
    String carnetIdentidad
) {}
