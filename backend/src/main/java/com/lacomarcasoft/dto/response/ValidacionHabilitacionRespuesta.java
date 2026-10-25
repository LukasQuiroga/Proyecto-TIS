package com.lacomarcasoft.dto.response;

public record ValidacionHabilitacionRespuesta(
    Long idExamen,
    Long idEstudiante,
    String estado,
    boolean puedeContinuar,
    String tituloMotivo,
    String motivo,
    String mensaje
) {}
