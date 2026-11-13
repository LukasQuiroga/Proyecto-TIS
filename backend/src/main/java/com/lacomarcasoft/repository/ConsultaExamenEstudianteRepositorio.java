
package com.lacomarcasoft.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class ConsultaExamenEstudianteRepositorio {

    private final JdbcTemplate jdbc;

    public ConsultaExamenEstudianteRepositorio(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Long> idsExamenesInscritos(Long idEstudiante) {
        return jdbc.queryForList("""
            SELECT DISTINCT id_examen
            FROM academico.examen_estudiante
            WHERE id_estudiante = ?
            ORDER BY id_examen
            """, Long.class, idEstudiante);
    }

    public boolean existeInscripcion(
            Long idExamen,
            Long idEstudiante) {

        return Boolean.TRUE.equals(
            jdbc.queryForObject("""
                SELECT EXISTS (
                    SELECT 1
                    FROM academico.examen_estudiante
                    WHERE id_examen = ?
                      AND id_estudiante = ?
                )
                """,
                Boolean.class,
                idExamen,
                idEstudiante
            )
        );
    }
}
