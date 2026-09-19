package com.lacomarcasoft.service;

import com.lacomarcasoft.repository.RolRepositorio;
import com.lacomarcasoft.repository.UsuarioRepositorio;

public class UsuarioServicio {

    private final UsuarioRepositorio usuarioRepositorio;
    private final RolRepositorio rolRepositorio;

    public UsuarioServicio(
            UsuarioRepositorio usuarioRepositorio,
            RolRepositorio rolRepositorio
    ) {
        this.usuarioRepositorio = usuarioRepositorio;
        this.rolRepositorio = rolRepositorio;
    }
}