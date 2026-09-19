package com.lacomarcasoft.repository;

import com.lacomarcasoft.modelo.Rol;

import java.util.List;
import java.util.Optional;

public interface RolRepositorio {

    List<Rol> listarTodos();

    Optional<Rol> buscarPorId(Long idRol);
}