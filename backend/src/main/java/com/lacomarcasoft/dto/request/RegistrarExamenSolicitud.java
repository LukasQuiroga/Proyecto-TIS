package com.lacomarcasoft.dto.request;

import jakarta.validation.constraints.*;

public record RegistrarExamenSolicitud(

    @NotBlank(message = "El código es obligatorio")
    @Size(max = 30, message = "El código no puede superar 30 caracteres")
    @Pattern(
        regexp = "^$|^[A-Za-z0-9_-]+$",
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
    String gestion,

    @NotBlank(message = "Debe seleccionar un estado")
    String estado,

    @Size(max = 500, message = "La descripción no puede superar 500 caracteres")
    String descripcion

) {}
