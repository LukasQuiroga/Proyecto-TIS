package com.lacomarcasoft.dto.request;

public record ActualizarUsuarioSolicitud(

        String nombre,
        String apellido,
        String carnetIdentidad,
        String correo,
        Boolean activo,
        Long idRol

) {
}