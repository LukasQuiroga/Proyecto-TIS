
package com.lacomarcasoft.dto.response;

public record GrupoAsignaturaRespuesta(
        Long idMateria,
        String grupo,
        Long idDocente,
        String nombreDocente
) {
}
