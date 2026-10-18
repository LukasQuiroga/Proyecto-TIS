package com.lacomarcasoft.repository;

import com.lacomarcasoft.modelo.Materia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import java.util.Optional;


import java.util.List;

@Repository
public interface MateriaRepositorio extends JpaRepository<Materia,Long> {

    @Query("""
        SELECT m
        FROM Materia m
        JOIN FETCH m.asignatura
        WHERE m.docente.idUsuario = :idUsuario
        ORDER BY m.asignatura.nombreAsignatura ASC, m.grupo ASC
        """)
    List<Materia> listarPorDocente(@Param("idUsuario") Long idUsuario);

    @Query("""
        SELECT m
        FROM Materia m
        JOIN FETCH m.asignatura
        ORDER BY m.asignatura.nombreAsignatura ASC, m.grupo ASC
        """)
    List<Materia> listarTodas();

    @Query("""
        SELECT m
        FROM Materia m
        JOIN FETCH m.asignatura
        JOIN FETCH m.docente
        WHERE m.asignatura.idAsignatura = :idAsignatura
        ORDER BY m.grupo ASC
        """)
    List<Materia> listarPorAsignatura(
            @Param("idAsignatura") Long idAsignatura
    );
    
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT m FROM Materia m WHERE m.idMateria = :idMateria")
    Optional<Materia> bloquearMateria(@Param("idMateria") Long idMateria);

}
