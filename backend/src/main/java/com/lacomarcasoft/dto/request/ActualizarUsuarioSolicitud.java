package com.lacomarcasoft.dto.request;

public record ActualizarUsuarioSolicitud(
        String nombres,
        String apellidos,
        String documentoIdentidad,
        String correo,
        String telefono,
        Long rolId,
        String codigoUniversitario,
        String carrera
) {}