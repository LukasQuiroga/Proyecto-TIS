
package com.lacomarcasoft.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;

public record RegistrarExpulsionSolicitud(

    @NotNull
    @Positive
    Long idExamen,

    @NotNull
    @Positive
    Long idEstudiante,

    @NotNull
    OffsetDateTime fechaHoraExpulsion,

    @NotBlank
    @Size(max = 200)
    String motivo,

    String observaciones

) {
}
