package com.lacomarcasoft.dto.response;

import java.util.List;

public record DocentesPorFacultadRespuesta(
        List<DocenteRespuesta> docentesFacultad,
        List<DocenteRespuesta> docentesSinFacultad
) {
}
