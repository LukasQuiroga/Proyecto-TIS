package com.lacomarcasoft.service;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ConsultaIngresoServicio {

    private final JdbcTemplate jdbc;

    public ConsultaIngresoServicio(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record ExamenDisponible(
        Long idExamen,
        String codigo,
        String nombreExamen,
        String materia,
        String estado
    ) {}

    public record EstudianteDisponible(
        Long idEstudiante,
        String codigoUniversitario,
        String nombreEstudiante
    ) {}

    
    @Transactional(readOnly = true)
    public List<ExamenDisponible> listarExamenes() {
        return jdbc.query("""
            SELECT
                e.id_examen,
                e.codigo,
                e.nombre_examen,
                e.estado,
                CONCAT(a.nombre_asignatura, ' - Grupo ', m.grupo) AS materia
            FROM academico.examen e
            JOIN academico.materia m
                ON m.id_materia = e.id_materia
            JOIN academico.asignatura a
                ON a.id_asignatura = m.id_asignatura
            ORDER BY e.id_examen DESC
            """,
            (rs, fila) -> new ExamenDisponible(
                rs.getLong("id_examen"),
                rs.getString("codigo"),
                rs.getString("nombre_examen"),
                rs.getString("materia"),
                rs.getString("estado")
            )
        );
    }


    @Transactional(readOnly = true)
    public List<EstudianteDisponible> listarEstudiantes(Long idExamen) {
        if (idExamen == null || idExamen <= 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Identificador de examen invalido"
            );
        }

        boolean existe = Boolean.TRUE.equals(jdbc.queryForObject("""
            SELECT EXISTS (
                SELECT 1
                FROM academico.examen
                WHERE id_examen = ?
            )
            """,
            Boolean.class,
            idExamen
        ));

        if (!existe) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Examen no encontrado"
            );
        }

        return jdbc.query("""
            SELECT
                u.id_usuario,
                u.codigo_sis,
                TRIM(CONCAT(u.nombre, ' ', u.apellido)) AS nombre_estudiante
            FROM academico.examen e
            JOIN academico.materia_estudiante me
                ON me.id_materia = e.id_materia
            JOIN seguridad.usuario u
                ON u.id_usuario = me.id_estudiante
            JOIN seguridad.rol r
                ON r.id_rol = u.id_rol
            WHERE e.id_examen = ?
                AND u.activo = TRUE
                AND UPPER(r.nombre_rol) = 'ESTUDIANTE'
            ORDER BY u.nombre, u.apellido
            """,
            (rs, fila) -> new EstudianteDisponible(
                rs.getLong("id_usuario"),
                rs.getString("codigo_sis"),
                rs.getString("nombre_estudiante")
            ),
            idExamen
        );
    }
}
