package com.lacomarcasoft.repository;

import com.lacomarcasoft.modelo.TokenSesion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TokenSesionRepositorio
    extends JpaRepository<TokenSesion,Long>{

    Optional<TokenSesion> findByTokenId(String tokenId);

}