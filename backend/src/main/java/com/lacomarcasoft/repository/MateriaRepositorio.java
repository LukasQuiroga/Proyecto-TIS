package com.lacomarcasoft.repository;

import com.lacomarcasoft.modelo.Materia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MateriaRepositorio extends JpaRepository<Materia,Long> {

    List<Materia> findByDocente_IdUsuarioOrderByNombreMateriaAscGrupoAsc(
        Long idUsuario
    );
}