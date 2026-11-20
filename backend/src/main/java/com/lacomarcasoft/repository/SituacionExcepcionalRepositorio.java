
package com.lacomarcasoft.repository;

import com.lacomarcasoft.modelo.SituacionExcepcional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SituacionExcepcionalRepositorio
        extends JpaRepository<SituacionExcepcional, Long> {

    List<SituacionExcepcional> findAllByOrderByFechaRegistroDesc();

    @EntityGraph(attributePaths = {
            "examen",
            "estudiante",
            "registradoPor"
    })
    @Query("""
            SELECT s
            FROM SituacionExcepcional s
            LEFT JOIN s.estudiante estudiante
            WHERE (:idExamen IS NULL
                    OR s.examen.idExamen = :idExamen)
              AND (:idEstudiante IS NULL
                    OR estudiante.idUsuario = :idEstudiante)
              AND (:tipoSituacion IS NULL
                    OR LOWER(s.tipoSituacion)
                    LIKE LOWER(CONCAT('%', :tipoSituacion, '%')))
            ORDER BY s.fechaRegistro DESC, s.idSituacion DESC
            """)
    List<SituacionExcepcional> buscarHistorial(
            @Param("idExamen") Long idExamen,
            @Param("idEstudiante") Long idEstudiante,
            @Param("tipoSituacion") String tipoSituacion
    );
    @EntityGraph(attributePaths = {
            "examen",
            "estudiante",
            "registradoPor"
    })
    @Query("""
            SELECT s
            FROM SituacionExcepcional s
            WHERE s.idSituacion = :idSituacion
            """)
    Optional<SituacionExcepcional> buscarDetalle(
            @Param("idSituacion") Long idSituacion
    );
}
