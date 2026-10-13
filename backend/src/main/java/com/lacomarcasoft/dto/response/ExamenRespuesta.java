package com.lacomarcasoft.dto.response;

import java.time.LocalDate;
import java.time.LocalTime;

public record ExamenRespuesta(

    Long idExamen,
    String codigo,
    String nombreExamen,
    Long idMateria,
    String nombreAsignatura,
    String tipoEvaluacion,
    String gestion,
    String estado,
    String descripcion,
    LocalDate fechaExamen,
    LocalTime horaInicio,
    LocalTime horaFin,
    String aula

) {}
