package com.lacomarcasoft.repository;

import com.lacomarcasoft.modelo.AsignaturaCarrera;
import com.lacomarcasoft.modelo.AsignaturaCarreraId;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AsignaturaCarreraRepositorio
        extends JpaRepository<AsignaturaCarrera, AsignaturaCarreraId> {

    List<AsignaturaCarrera> findByIdAsignatura(Long idAsignatura);
}