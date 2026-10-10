package com.lacomarcasoft.dto.request;

import jakarta.validation.constraints.*;
import java.util.List;

public record RegistrarAsignaturaSolicitud(

    @NotBlank(message = "El código es obligatorio")
    @Size(max = 30, message = "El código no puede superar 30 caracteres")
    @Pattern(
        regexp = "^$|^[A-Za-z0-9_-]+$",
        message = "El código contiene caracteres no permitidos"
    )
    String codigoAsignatura,

    @NotBlank(message = "El nombre es obligatorio")
    @Size(
        max = 120,
        message = "El nombre no puede superar 120 caracteres"
    )
    String nombreAsignatura,

    @NotNull(message = "El semestre es obligatorio")
    @Min(value = 1, message = "El semestre mínimo es 1")
    @Max(value = 10, message = "El semestre máximo es 10")
    Short semestre,

    Boolean activo,

    String descripcion,

    @NotEmpty(message = "Debe seleccionar al menos una carrera")
    List<
        @NotBlank(message = "El nombre de la carrera no puede estar vacío")
        @Size(max = 120, message = "La carrera no puede superar 120 caracteres")
        String
    > carreras

) {}