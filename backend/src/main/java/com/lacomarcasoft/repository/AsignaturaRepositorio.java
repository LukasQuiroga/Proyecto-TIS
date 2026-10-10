package com.lacomarcasoft.repository;

import com.lacomarcasoft.modelo.Asignatura;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AsignaturaRepositorio
        extends JpaRepository<Asignatura, Long> {

    // Verificar si existe un codigo de asignatura
    // sin distinguir mayusculas, minusculas ni espacios externos.

    @Query("""
        SELECT COUNT(a) > 0
        FROM Asignatura a
        WHERE UPPER(TRIM(a.codigoAsignatura)) =
              UPPER(TRIM(:codigo))
        """)
    boolean existeCodigo(@Param("codigo") String codigo);


    // Verificar si existe una asignatura con el mismo
    // nombre en una carrera determinada.

    @Query("""
        SELECT COUNT(a) > 0
        FROM Asignatura a
        JOIN AsignaturaCarrera ac
            ON ac.idAsignatura = a.idAsignatura
        WHERE LOWER(TRIM(a.nombreAsignatura)) =
              LOWER(TRIM(:nombre))
          AND LOWER(TRIM(ac.carrera)) =
              LOWER(TRIM(:carrera))
        """)
    boolean existeNombreEnCarrera(
            @Param("nombre") String nombre,
            @Param("carrera") String carrera
    );


    // Buscar asignaturas por codigo o nombre.

    @Query("""
        SELECT a
        FROM Asignatura a
        WHERE LOWER(a.codigoAsignatura) LIKE
              LOWER(CONCAT('%', :texto, '%'))
           OR LOWER(a.nombreAsignatura) LIKE
              LOWER(CONCAT('%', :texto, '%'))
        ORDER BY a.nombreAsignatura ASC
        """)
    List<Asignatura> buscarPorCodigoONombre(
            @Param("texto") String texto
    );


    // Listar asignaturas ordenadas alfabeticamente.

    List<Asignatura> findAllByOrderByNombreAsignaturaAsc();
}