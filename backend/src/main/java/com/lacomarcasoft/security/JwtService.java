package com.lacomarcasoft.security;

import com.lacomarcasoft.modelo.Usuario;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;

import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private final String secret;
    private final long expirationMs;

    public JwtService(
        @Value("${jwt.secret}") String secret,
        @Value("${jwt.expiration-ms}") long expirationMs
    ){
        this.secret=secret;
        this.expirationMs=expirationMs;
    }

    private SecretKey obtenerClave(){
        byte[] bytes=Decoders.BASE64.decode(secret);

        return Keys.hmacShaKeyFor(bytes);
    }

    public String generarToken(
        Usuario usuario,
        String tokenId
    ){
        Date ahora=new Date();

        Date expiracion=new Date(
            ahora.getTime()+expirationMs
        );

        return Jwts.builder()
            .id(tokenId)
            .subject(usuario.getCorreo())
            .claim(
                "idUsuario",
                usuario.getIdUsuario()
            )
            .claim(
                "rol",
                usuario.getRol().getNombreRol()
            )
            .issuedAt(ahora)
            .expiration(expiracion)
            .signWith(obtenerClave())
            .compact();
    }

    public String generarTokenId(){
        return UUID.randomUUID().toString();
    }

    public Claims obtenerClaims(String token){
        return Jwts.parser()
            .verifyWith(obtenerClave())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    public String obtenerCorreo(String token){
        return obtenerClaims(token).getSubject();
    }

    public String obtenerTokenId(String token){
        return obtenerClaims(token).getId();
    }

    public String obtenerRol(String token){
        return obtenerClaims(token)
            .get("rol",String.class);
    }

        public Long obtenerIdUsuario(String token) {

            Number idUsuario = obtenerClaims(token)
                .get("idUsuario", Number.class);

            return idUsuario.longValue();
        }

    public boolean esValido(String token){

        try{

            Claims claims=obtenerClaims(token);

            return claims
                .getExpiration()
                .after(new Date());

        }catch(Exception e){

            return false;

        }
    }
}