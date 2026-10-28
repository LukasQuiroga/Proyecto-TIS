package com.lacomarcasoft.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ExamenEstudianteRepositorio {

    private final JdbcTemplate jdbc;

    public ExamenEstudianteRepositorio(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void insertarSiNoExiste(Long idExamen, Long idEstudiante) {
        jdbc.update("""
            INSERT INTO academico.examen_estudiante
                (id_examen, id_estudiante)
            VALUES (?, ?)
            ON CONFLICT DO NOTHING
            """, idExamen, idEstudiante);
    }
}
