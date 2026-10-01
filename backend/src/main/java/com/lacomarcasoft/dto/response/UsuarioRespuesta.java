package com.lacomarcasoft.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record UsuarioRespuesta(
        Long idUsuario,
        String nombre,
        String apellido,
        String carnetIdentidad,
        String correo,
        String celular,
        String carrera,
        String codigoSis,
        Long idRol,
        String nombreRol,
        Boolean activo,
        LocalDateTime fechaCreacion,
        List<String> permisos
) {
}