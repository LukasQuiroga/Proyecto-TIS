package com.lacomarcasoft.repository;

import com.lacomarcasoft.modelo.Usuario;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepositorio {

    List<Usuario> listarTodos();

    Optional<Usuario> buscarPorId(Long idUsuario);

    Optional<Usuario> buscarPorCorreo(String correo);

    Usuario guardar(Usuario usuario);
}