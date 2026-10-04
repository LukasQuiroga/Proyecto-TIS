package com.lacomarcasoft.dto.request;

import java.util.List;

public record ActualizarUsuarioSolicitud(
    String nombre,
    String apellido,
    String carnetIdentidad,
    String correo,
    String celular,
    String carrera,
    String codigoSis,
    Boolean activo,
    Long idRol,
    List<Long> idsMaterias
){}