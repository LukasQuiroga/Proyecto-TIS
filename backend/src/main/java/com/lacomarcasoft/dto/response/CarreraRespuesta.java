package com.lacomarcasoft.dto.response;

public record CarreraRespuesta(
    Long idCarrera,
    String nombre,
    Long idFacultad,
    String codigoFacultad,
    String nombreFacultad
){}
