
package com.lacomarcasoft.service;

import com.lacomarcasoft.modelo.Examen;
import com.lacomarcasoft.modelo.Usuario;
import com.lacomarcasoft.repository.ExamenRepositorio;
import com.lacomarcasoft.repository.UsuarioRepositorio;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AccesoExamenDocenteServicio {

    private final ExamenRepositorio examenes;
    private final UsuarioRepositorio usuarios;

    public AccesoExamenDocenteServicio(
            ExamenRepositorio examenes,
            UsuarioRepositorio usuarios) {
        this.examenes = examenes;
        this.usuarios = usuarios;
    }

    public Long obtenerDocenteAutenticado() {
        Authentication auth = SecurityContextHolder
                .getContext()
                .getAuthentication();

        if (auth == null
                || !auth.isAuthenticated()
                || !(auth.getDetails() instanceof Long idUsuario)) {
            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Inicie sesion"
            );
        }
        boolean esDocente = auth.getAuthorities().stream()
            .anyMatch(a -> "ROLE_DOCENTE".equals(a.getAuthority()));

        boolean tienePermiso = auth.getAuthorities().stream()
            .anyMatch(a -> "CONTROL_INGRESO".equals(a.getAuthority()));

        if (!esDocente || !tienePermiso) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "No tiene permisos para controlar el ingreso"
            );
        }

        return idUsuario;
    }

    public Examen autorizado(Long examenId, Long responsableId) {
        if (responsableId == null) {
            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Inicie sesion"
            );
        }

        if (examenId == null || examenId <= 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Identificador de examen invalido"
            );
        }

        Usuario usuario = usuarios.findById(responsableId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Usuario no encontrado"
            ));

        if (!Boolean.TRUE.equals(usuario.getActivo())
                || usuario.getRol() == null
                || !"DOCENTE".equalsIgnoreCase(
                    usuario.getRol().getNombreRol())) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Solo los docentes activos pueden acceder a sus examenes"
            );
        }

        Examen examen = examenes.findById(examenId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Examen no encontrado"
            ));

        if (examen.getMateria() == null
                || examen.getMateria().getDocente() == null
                || !responsableId.equals(
                    examen.getMateria().getDocente().getIdUsuario())) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "No eres el docente encargado de esta materia y grupo"
            );
        }

        return examen;
    }

    public Examen verificarExamenActual(Long examenId) {
        return autorizado(examenId, obtenerDocenteAutenticado());
    }
}
