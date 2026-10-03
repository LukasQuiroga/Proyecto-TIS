package com.lacomarcasoft.service;

import com.lacomarcasoft.modelo.TokenSesion;
import com.lacomarcasoft.modelo.Usuario;
import com.lacomarcasoft.repository.TokenSesionRepositorio;

import org.springframework.stereotype.Service;

@Service
public class TokenSesionService {

    private final TokenSesionRepositorio tokenSesionRepositorio;

    public TokenSesionService(
        TokenSesionRepositorio tokenSesionRepositorio
    ){
        this.tokenSesionRepositorio=
            tokenSesionRepositorio;
    }

    public void crear(
        Usuario usuario,
        String tokenId
    ){

        TokenSesion sesion=new TokenSesion();

        sesion.setUsuario(usuario);
        sesion.setTokenId(tokenId);
        sesion.setActiva(true);

        tokenSesionRepositorio.save(sesion);
    }

    public boolean estaActiva(String tokenId){

        return tokenSesionRepositorio
            .findByTokenId(tokenId)
            .map(TokenSesion::getActiva)
            .orElse(false);
    }

    public void cerrar(String tokenId){

        tokenSesionRepositorio
            .findByTokenId(tokenId)
            .ifPresent(sesion->{

                sesion.setActiva(false);

                tokenSesionRepositorio.save(sesion);

            });
    }
}