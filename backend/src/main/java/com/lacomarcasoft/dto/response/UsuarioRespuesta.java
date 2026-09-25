package com.lacomarcasoft.dto.response;

public record UsuarioRespuesta(

        Long idUsuario,
        String nombre,
        String apellido,
        String correo,
        Long idRol,
        String nombreRol,
        Boolean activo

) {
}