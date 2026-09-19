package com.lacomarcasoft.controller;

import com.lacomarcasoft.service.UsuarioServicio;

public class UsuarioControlador {

    private final UsuarioServicio usuarioServicio;

    public UsuarioControlador(
            UsuarioServicio usuarioServicio
    ) {
        this.usuarioServicio = usuarioServicio;
    }
}