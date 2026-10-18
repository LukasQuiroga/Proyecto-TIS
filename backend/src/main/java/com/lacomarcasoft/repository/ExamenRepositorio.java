package com.lacomarcasoft.repository;

import com.lacomarcasoft.modelo.Examen;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExamenRepositorio extends JpaRepository<Examen, Long> {

    @Query("""
        SELECT e
        FROM Examen e
        JOIN FETCH e.materia m
        JOIN FETCH m.asignatura
        ORDER BY e.idExamen DESC
        """)
    List<Examen> listarTodos();

    @Query("""
        SELECT e
        FROM Examen e
        JOIN FETCH e.materia m
        JOIN FETCH m.asignatura
        WHERE LOWER(e.nombreExamen) LIKE
              LOWER(CONCAT('%', :texto, '%'))
           OR LOWER(m.asignatura.nombreAsignatura) LIKE
              LOWER(CONCAT('%', :texto, '%'))
        ORDER BY e.idExamen DESC
        """)
    List<Examen> buscar(@Param("texto") String texto);

    @Query("""
        SELECT e
        FROM Examen e
        JOIN FETCH e.materia m
        JOIN FETCH m.asignatura
        WHERE e.idExamen = :id
        """)
    Optional<Examen> obtenerDetalle(@Param("id") Long id);

    @Query("""
        SELECT COUNT(e) > 0
        FROM Examen e
        WHERE UPPER(TRIM(e.codigo)) = UPPER(TRIM(:codigo))
        """)
    boolean existeCodigo(@Param("codigo") String codigo);

    @Query("""
        SELECT COUNT(e) > 0
        FROM Examen e
        WHERE UPPER(TRIM(e.codigo)) = UPPER(TRIM(:codigo))
          AND e.idExamen <> :id
        """)
    boolean existeCodigoExcepto(
            @Param("codigo") String codigo,
            @Param("id") Long id
    );
}
