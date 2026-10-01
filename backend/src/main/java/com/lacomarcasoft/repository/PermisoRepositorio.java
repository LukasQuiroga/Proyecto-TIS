package com.lacomarcasoft.repository;

import com.lacomarcasoft.modelo.Permiso;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


@Repository
public interface PermisoRepositorio extends JpaRepository<Permiso, Long> {

}
