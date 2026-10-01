package com.lacomarcasoft.dto.request;

import java.util.List;

public record CrearRolSolicitud(
        String nombreRol,
        String descripcionRol,
        List<Long> permisos
) {
}
