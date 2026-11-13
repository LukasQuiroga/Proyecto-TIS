
package com.lacomarcasoft.repository;

import com.lacomarcasoft.modelo.MateriaEstudiante;
import com.lacomarcasoft.modelo.MateriaEstudianteId;
import com.lacomarcasoft.modelo.Usuario;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MateriaEstudianteRepositorio
        extends JpaRepository<MateriaEstudiante, MateriaEstudianteId> {

    boolean existsByMateria_IdMateriaAndEstudiante_IdUsuario(
            Long idMateria,
            Long idUsuario
    );

    List<MateriaEstudiante> findByMateria_IdMateria(
            Long idMateria
    );

    List<MateriaEstudiante> findByEstudiante_IdUsuario(
            Long idUsuario
    );

    List<MateriaEstudiante>
    findByMateria_IdMateriaAndQrInscripcionIsNotNull(
            Long idMateria
    );

    @Query("""
        SELECT u
        FROM MateriaEstudiante me
        JOIN me.estudiante u
        JOIN FETCH u.rol r
        WHERE me.materia.idMateria = :idMateria
          AND u.activo = true
          AND UPPER(r.nombreRol) = 'ESTUDIANTE'
        ORDER BY u.apellido ASC, u.nombre ASC
        """)
    List<Usuario> listarEstudiantesActivosPorMateria(
            @Param("idMateria") Long idMateria
    );
}
