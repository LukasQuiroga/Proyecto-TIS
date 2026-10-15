package com.lacomarcasoft.security;

import com.lacomarcasoft.modelo.Usuario;
import com.lacomarcasoft.repository.UsuarioRepositorio;
import com.lacomarcasoft.service.TokenSesionService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final TokenSesionService tokenSesionService;
    private final UsuarioRepositorio usuarioRepositorio;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            TokenSesionService tokenSesionService,
            UsuarioRepositorio usuarioRepositorio
    ) {
        this.jwtService = jwtService;
        this.tokenSesionService = tokenSesionService;
        this.usuarioRepositorio = usuarioRepositorio;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String authorization = request.getHeader("Authorization");

        if (
                authorization == null ||
                !authorization.startsWith("Bearer ")
        ) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authorization.substring(7);

        try {
            if (!jwtService.esValido(token)) {
                rechazarAutenticacion(response);
                return;
            }

            String tokenId = jwtService.obtenerTokenId(token);

            if (
                    tokenId == null ||
                    !tokenSesionService.estaActiva(tokenId)
            ) {
                rechazarAutenticacion(response);
                return;
            }

            Long idUsuario = jwtService.obtenerIdUsuario(token);
            String correoToken = jwtService.obtenerCorreo(token);

            if (idUsuario == null || correoToken == null) {
                rechazarAutenticacion(response);
                return;
            }

            Usuario usuario = usuarioRepositorio
                    .findById(idUsuario)
                    .orElse(null);

            if (
                    usuario == null ||
                    !Boolean.TRUE.equals(usuario.getActivo()) ||
                    usuario.getRol() == null
            ) {
                rechazarAutenticacion(response);
                return;
            }

            if (!correoToken.equalsIgnoreCase(usuario.getCorreo())) {
                rechazarAutenticacion(response);
                return;
            }

            String nombreRol = usuario.getRol().getNombreRol();

            if (nombreRol == null || nombreRol.isBlank()) {
                rechazarAutenticacion(response);
                return;
            }

            List<GrantedAuthority> autoridades = new ArrayList<>();

            autoridades.add(
                    new SimpleGrantedAuthority(
                            "ROLE_" + nombreRol
                    )
            );

            if (usuario.getRol().getPermisos() != null) {
                usuario.getRol().getPermisos().forEach(permiso -> {
                    if (
                            permiso != null &&
                            permiso.getNombrePermiso() != null
                    ) {
                        autoridades.add(
                                new SimpleGrantedAuthority(
                                        permiso.getNombrePermiso()
                                )
                        );
                    }
                });
            }

            UsernamePasswordAuthenticationToken autenticacion =
                    new UsernamePasswordAuthenticationToken(
                            usuario.getCorreo(),
                            null,
                            autoridades
                    );

            autenticacion.setDetails(usuario.getIdUsuario());

            SecurityContextHolder
                    .getContext()
                    .setAuthentication(autenticacion);

        } catch (Exception e) {
            rechazarAutenticacion(response);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void rechazarAutenticacion(
            HttpServletResponse response
    ) throws IOException {
        SecurityContextHolder.clearContext();

        response.sendError(
                HttpServletResponse.SC_UNAUTHORIZED,
                "Sesion invalida o usuario no autorizado"
        );
    }
}