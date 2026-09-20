package com.lacomarcasoft.dto.response;

import java.util.List;

public record ConsultaEstudiantesRespuesta(

        List<EstudianteRespuesta> estudiantes,

        long total,

        int pagina,

        int tamanio,

        int totalPaginas

) {
}