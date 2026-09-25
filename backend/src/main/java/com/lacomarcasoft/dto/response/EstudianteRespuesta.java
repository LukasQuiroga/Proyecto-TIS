package com.lacomarcasoft.dto.response;

import java.time.OffsetDateTime;

public record EstudianteRespuesta(

        Long idUsuario,

        String codigoUniversitario,

        String documento,

        String nombres,

        String apellidos,

        String carrera,

        Boolean activo,

        String correoElectronico,

        String telefono,

        OffsetDateTime fechaRegistro

) {
}