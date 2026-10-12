
package com.lacomarcasoft.dto.request;

import jakarta.validation.constraints.NotBlank;

public record InscripcionQrSolicitud(

    @NotBlank(message = "El token QR es obligatorio")
    String token

) {}
