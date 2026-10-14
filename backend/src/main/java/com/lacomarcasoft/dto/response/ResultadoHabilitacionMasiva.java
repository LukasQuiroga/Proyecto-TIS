package com.lacomarcasoft.dto.response;

import java.util.List;

public record ResultadoHabilitacionMasiva(
    int total,
    int exitosos,
    int fallidos,
    List<DetalleResultado> resultados
) {
    public record DetalleResultado(
        Long idEstudiante,
        boolean exitoso,
        String mensaje
    ) {}
}
