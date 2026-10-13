package com.lacomarcasoft.repository;

import com.lacomarcasoft.modelo.Materia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

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
}
