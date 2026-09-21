package com.lacomarcasoft.service;

import com.lacomarcasoft.modelo.Rol;
import com.lacomarcasoft.modelo.Usuario;

import com.lacomarcasoft.repository.RolRepositorio;
import com.lacomarcasoft.repository.UsuarioRepositorio;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UsuarioServicio {

    private final UsuarioRepositorio usuarioRepositorio;

    private final RolRepositorio rolRepositorio;

    public UsuarioServicio(
            UsuarioRepositorio usuarioRepositorio,
            RolRepositorio rolRepositorio
    ){

        this.usuarioRepositorio = usuarioRepositorio;
        this.rolRepositorio = rolRepositorio;

    }

    public List<Usuario> listar(){

        return usuarioRepositorio.findAll();

    }

    public Usuario buscar(Long id){

        return usuarioRepositorio.findById(id)
                .orElseThrow(
                        () ->
                        new RuntimeException(
                                "Usuario no encontrado"
                        )
                );

    }

    public Usuario registrar(
            Usuario usuario,
            Long idRol
    ){

        Rol rol =
                rolRepositorio.findById(idRol)
                .orElseThrow(
                        () ->
                        new RuntimeException(
                                "Rol no encontrado"
                        )
                );

        usuario.setRol(rol);

        usuario.setActivo(true);

        return usuarioRepositorio.save(usuario);

    }

    public Usuario modificar(
            Long id,
            Usuario datos,
            Long idRol
    ){

        Usuario usuario = buscar(id);

        Rol rol =
                rolRepositorio.findById(idRol)
                .orElseThrow(
                        () ->
                        new RuntimeException(
                                "Rol no encontrado"
                        )
                );

        usuario.setNombre(datos.getNombre());

        usuario.setApellido(datos.getApellido());

        usuario.setCorreo(datos.getCorreo());

        usuario.setContrasena(datos.getContrasena());

        usuario.setActivo(datos.getActivo());

        usuario.setRol(rol);

        return usuarioRepositorio.save(usuario);

    }
}