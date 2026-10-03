package com.lacomarcasoft.security;

import com.lacomarcasoft.service.TokenSesionService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter
    extends OncePerRequestFilter{

    private final JwtService jwtService;

    private final TokenSesionService tokenSesionService;

    public JwtAuthenticationFilter(
        JwtService jwtService,
        TokenSesionService tokenSesionService
    ){
        this.jwtService=jwtService;
        this.tokenSesionService=tokenSesionService;
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException,IOException{

        String authorization=
            request.getHeader("Authorization");

        if(
            authorization==null ||
            !authorization.startsWith("Bearer ")
        ){

            filterChain.doFilter(
                request,
                response
            );

            return;
        }

        String token=
            authorization.substring(7);

        try{

            if(!jwtService.esValido(token)){

                response.setStatus(
                    HttpServletResponse.SC_UNAUTHORIZED
                );

                return;
            }

            String tokenId=
                jwtService.obtenerTokenId(token);

            if(!tokenSesionService.estaActiva(tokenId)){

                response.setStatus(
                    HttpServletResponse.SC_UNAUTHORIZED
                );

                return;
            }

            String correo=
                jwtService.obtenerCorreo(token);

            String rol=
                jwtService.obtenerRol(token);

            UsernamePasswordAuthenticationToken autenticacion=
                new UsernamePasswordAuthenticationToken(
                    correo,
                    null,
                    List.of(
                        new SimpleGrantedAuthority(
                            "ROLE_"+rol
                        )
                    )
                );

            SecurityContextHolder
                .getContext()
                .setAuthentication(autenticacion);

        }catch(Exception e){

            response.setStatus(
                HttpServletResponse.SC_UNAUTHORIZED
            );

            return;
        }

        filterChain.doFilter(
            request,
            response
        );
    }
}