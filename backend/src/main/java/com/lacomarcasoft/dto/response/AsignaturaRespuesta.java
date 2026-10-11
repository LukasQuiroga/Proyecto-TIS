package com.lacomarcasoft.dto.response;

import java.util.List;

public record AsignaturaRespuesta(

    Long idAsignatura,
    String codigoAsignatura,
    String nombreAsignatura,
    Short semestre,
    Boolean activo,
    String descripcion,
    List<String> carreras
) {}