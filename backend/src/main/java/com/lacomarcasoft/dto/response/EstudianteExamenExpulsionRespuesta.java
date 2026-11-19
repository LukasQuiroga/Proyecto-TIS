
package com.lacomarcasoft.dto.response;

public record EstudianteExamenExpulsionRespuesta(
    Long idEstudiante,
    String nombreCompleto,
    String codigoUniversitario,
    boolean expulsado
) {
}
