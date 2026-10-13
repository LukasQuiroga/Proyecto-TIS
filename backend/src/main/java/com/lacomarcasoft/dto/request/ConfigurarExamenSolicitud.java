
package com.lacomarcasoft.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record ConfigurarExamenSolicitud(

        @NotNull(message = "La fecha del examen es obligatoria")
        LocalDate fechaExamen,

        @NotNull(message = "La hora de inicio es obligatoria")
        LocalTime horaInicio,

        @NotNull(message = "La duración del examen es obligatoria")
        @Min(value = 1, message = "La duración debe ser mayor a cero")
        Integer duracionMinutos

) {}
