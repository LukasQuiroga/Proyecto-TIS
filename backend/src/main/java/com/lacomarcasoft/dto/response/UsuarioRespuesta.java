package com.lacomarcasoft.dto.response;
import java.util.List;

public record UsuarioRespuesta(

        Long idUsuario,
        String nombre,
        String apellido,
        String correo,
        Long idRol,
        String nombreRol,
        Boolean activo,
        List<String> permisos

) {
}