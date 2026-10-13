package com.lacomarcasoft.repository;

import com.lacomarcasoft.modelo.Facultad;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FacultadRepositorio
        extends JpaRepository<Facultad,Long> {

    List<Facultad> findAllByOrderByNombreAsc();

}
