package com.lacomarcasoft.dto.response;

import java.util.List;

public record FacultadRespuesta(
    Long idFacultad,
    String codigo,
    String nombre,
    List<CarreraRespuesta> carreras
){}
