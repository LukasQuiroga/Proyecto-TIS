package com.lacomarcasoft.repository;

import com.lacomarcasoft.modelo.Carrera;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface CarreraRepositorio
        extends JpaRepository<Carrera, Long> {

    List<Carrera> findAllByOrderByNombreAsc();

    List<Carrera> findByNombreIn(Collection<String> nombres);
}