package com.lacomarcasoft.dto.request;

public record ActualizarUsuarioSolicitud(
        String nombre,
        String apellido,
        String carnetIdentidad,
        String correo,
        String celular,
        String carrera,
        String codigoSis,
        Boolean activo,
        Long idRol
) {
}