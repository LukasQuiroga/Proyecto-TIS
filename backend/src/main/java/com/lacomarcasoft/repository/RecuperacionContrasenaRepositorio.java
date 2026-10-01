package com.lacomarcasoft.repository;

import com.lacomarcasoft.modelo.RecuperacionContrasena;
import com.lacomarcasoft.modelo.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecuperacionContrasenaRepositorio
        extends JpaRepository<RecuperacionContrasena, Long> {

    Optional<RecuperacionContrasena>
    findTopByUsuarioAndUsadoFalseOrderByFechaCreacionDesc(Usuario usuario);

    List<RecuperacionContrasena>
    findByUsuarioAndUsadoFalse(Usuario usuario);
}