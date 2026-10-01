package com.lacomarcasoft.dto.request;
import java.util.List;

public record ActualizarPermisosSolicitud(
        List<Long> permisos
) {
}
