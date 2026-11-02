
package com.lacomarcasoft.dto.response;

import java.time.LocalDate;
import java.time.LocalTime;

public record ExamenInscritoRespuesta(
    Long idExamen,
    String nombreExamen,
    String codigo,
    String tipoEvaluacion,
    String gestion,
    String estado,
    String descripcion,
    String asignatura,
    String grupo,
    LocalDate fechaExamen,
    LocalTime horaInicio,
    LocalTime horaFin,
    String aula,
    String docente
) {}
