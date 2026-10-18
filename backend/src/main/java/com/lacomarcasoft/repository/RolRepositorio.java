package com.lacomarcasoft.repository;


import com.lacomarcasoft.modelo.Rol;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;



@Repository
public interface RolRepositorio 
        extends JpaRepository<Rol,Long> {


}