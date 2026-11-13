package com.lacomarcasoft.repository;

import com.lacomarcasoft.modelo.QrExamenEstudiante;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QrExamenEstudianteRepositorio
        extends JpaRepository<QrExamenEstudiante, Long> {

    Optional<QrExamenEstudiante> findByTokenHash(String tokenHash);

    Optional<QrExamenEstudiante>
    findByExamen_IdExamenAndEstudiante_IdUsuario(
            Long idExamen,
            Long idEstudiante
    );

    Optional<QrExamenEstudiante>
    findByExamen_IdExamenAndEstudiante_IdUsuarioAndRevocadoFalse(
            Long idExamen,
            Long idEstudiante
    );

    List<QrExamenEstudiante> findByExamen_IdExamen(Long idExamen);

    @Query("""
        SELECT q
        FROM QrExamenEstudiante q
        JOIN FETCH q.examen e
        JOIN FETCH e.materia m
        JOIN FETCH m.asignatura a
        JOIN FETCH q.estudiante u
        WHERE q.examen.idExamen = :idExamen
        ORDER BY u.apellido ASC, u.nombre ASC
        """)
    List<QrExamenEstudiante> listarConDetallePorExamen(
            @Param("idExamen") Long idExamen
    );

    @Query("""
        SELECT q
        FROM QrExamenEstudiante q
        JOIN FETCH q.examen e
        JOIN FETCH e.materia m
        JOIN FETCH m.asignatura a
        JOIN FETCH q.estudiante u
        WHERE q.examen.idExamen = :idExamen
          AND q.revocado = false
          AND q.estadoEnvio IN ('PENDIENTE', 'ERROR')
        ORDER BY u.apellido ASC, u.nombre ASC
        """)
    List<QrExamenEstudiante> listarPendientesPorExamen(
            @Param("idExamen") Long idExamen
    );
}
