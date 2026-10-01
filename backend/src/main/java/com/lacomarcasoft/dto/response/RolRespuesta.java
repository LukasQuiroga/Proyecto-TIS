package com.lacomarcasoft.dto.response;
import java.util.List;

public record RolRespuesta(
        Long idRol,
        String nombreRol,
        String descripcionRol,
        List<PermisoRespuesta> permisos
) {
}