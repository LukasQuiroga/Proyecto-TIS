
package com.lacomarcasoft.repository;

import com.lacomarcasoft.modelo.MateriaEstudiante;
import com.lacomarcasoft.modelo.MateriaEstudianteId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MateriaEstudianteRepositorio
        extends JpaRepository<MateriaEstudiante, MateriaEstudianteId> {

    boolean existsByMateria_IdMateriaAndEstudiante_IdUsuario(
            Long idMateria, Long idUsuario);

    List<MateriaEstudiante> findByMateria_IdMateria(Long idMateria);

    List<MateriaEstudiante> findByEstudiante_IdUsuario(Long idUsuario);
}
