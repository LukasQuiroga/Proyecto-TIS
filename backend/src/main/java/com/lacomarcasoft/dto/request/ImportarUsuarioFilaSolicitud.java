package com.lacomarcasoft.dto.request;

public record ImportarUsuarioFilaSolicitud(

        int fila,

        String documento,

        String nombres,

        String apellidos,

        String correo,

        String telefono,

        String rol,

        String estado,

        String codigoSis,

        String carrera,

        String facultad

) {
}