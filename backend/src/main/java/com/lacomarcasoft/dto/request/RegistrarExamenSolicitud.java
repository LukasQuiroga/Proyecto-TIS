package com.lacomarcasoft.dto.request;

import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.LocalTime;

public record RegistrarExamenSolicitud(

    @NotBlank(message = "El código es obligatorio")
    @Size(max = 30, message = "El código no puede superar 30 caracteres")
    @Pattern(
        regexp = "^[A-Za-z0-9_-]+$",
        message = "El código contiene caracteres no permitidos"
    )
    String codigoExamen,

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 120, message = "El nombre no puede superar 120 caracteres")
    String nombreExamen,

    @NotNull(message = "Debe seleccionar una asignatura")
    Long idMateria,

    @NotBlank(message = "Debe seleccionar un tipo de examen")
    String tipoEvaluacion,

    @NotBlank(message = "La gestión es obligatoria")
    @Size(max = 20, message = "La gestión no puede superar 20 caracteres")
    @Pattern(
        regexp = "^\\d{1,2}/\\d{4}$",
        message = "La gestión debe tener el formato periodo/año, por ejemplo 2/2026"
    )
    String gestion,

    @NotBlank(message = "Debe seleccionar un estado")
    String estado,

    @Size(max = 500, message = "La descripción no puede superar 500 caracteres")
    String descripcion,

    @NotNull(message = "La fecha del examen es obligatoria")
    LocalDate fechaExamen,

    @NotNull(message = "La hora de inicio es obligatoria")
    LocalTime horaInicio,

    @NotNull(message = "La hora de fin es obligatoria")
    LocalTime horaFin

) {}
