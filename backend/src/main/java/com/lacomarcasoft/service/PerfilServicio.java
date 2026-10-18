package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.request.ActualizarTelefonoPerfilSolicitud;
import com.lacomarcasoft.dto.request.CambiarContrasenaPerfilSolicitud;
import com.lacomarcasoft.dto.response.PerfilRespuesta;
import com.lacomarcasoft.modelo.Usuario;
import com.lacomarcasoft.repository.UsuarioRepositorio;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PerfilServicio {

    private final UsuarioRepositorio usuarios;
    private final UsuarioServicio usuarioServicio;
    private final PasswordEncoder passwordEncoder;
    private final LogActividadServicio auditoria;

    public PerfilServicio(
            UsuarioRepositorio usuarios,
            UsuarioServicio usuarioServicio,
            PasswordEncoder passwordEncoder,
            LogActividadServicio auditoria
    ) {
        this.usuarios = usuarios;
        this.usuarioServicio = usuarioServicio;
        this.passwordEncoder = passwordEncoder;
        this.auditoria = auditoria;
    }

    @Transactional(readOnly = true)
    public PerfilRespuesta consultar(Long idUsuario) {
        Usuario usuario = obtenerUsuario(idUsuario);

        return new PerfilRespuesta(
            usuarioServicio.buscarRespuesta(idUsuario),
            usuario.getFotoPerfil()
        );
    }

    @Transactional
    public PerfilRespuesta actualizarTelefono(
            Long idUsuario,
            ActualizarTelefonoPerfilSolicitud solicitud
    ) {
        Usuario usuario = obtenerUsuario(idUsuario);

        String celular = solicitud.celular().trim();

        if (!celular.matches("^\\+?[0-9][0-9\\s-]{6,28}$")) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Ingrese un numero de telefono valido"
            );
        }

        if (!celular.equals(usuario.getCelular())) {
            usuario.setCelular(celular);
            usuarios.saveAndFlush(usuario);

            auditoria.registrar(
                idUsuario,
                "ACTUALIZAR_TELEFONO_PERFIL",
                "El usuario actualizo su telefono de contacto",
                null,
                true
            );
        }

        return consultar(idUsuario);
    }

    @Transactional
    public void cambiarContrasena(
            Long idUsuario,
            CambiarContrasenaPerfilSolicitud solicitud
    ) {
        Usuario usuario = obtenerUsuario(idUsuario);

        String actual = solicitud.contrasenaActual();
        String nueva = solicitud.nuevaContrasena();
        String confirmacion = solicitud.confirmarContrasena();

        if (!coincide(actual, usuario.getContrasena())) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "La contraseña actual es incorrecta."
            );
        }

        if (!nueva.equals(confirmacion)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Las nuevas contrasenas no coinciden"
            );
        }

        if (nueva.length() < 8 || nueva.length() > 64) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "La contrasena debe tener entre 8 y 64 caracteres"
            );
        }

        if (!nueva.matches(".*[A-Z].*")
                || !nueva.matches(".*[a-z].*")
                || !nueva.matches(".*[0-9].*")) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "La contrasena debe incluir mayuscula, minuscula y numero"
            );
        }

        if (coincide(nueva, usuario.getContrasena())) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "La nueva contraseña debe ser diferente de la contraseña actual."
            );
        }

        usuario.setContrasena(passwordEncoder.encode(nueva));
        usuarios.saveAndFlush(usuario);

        auditoria.registrar(
            idUsuario,
            "CAMBIAR_CONTRASENA_PERFIL",
            "El usuario cambio su contrasena",
            null,
            true
        );
    }

    private Usuario obtenerUsuario(Long idUsuario) {
        Usuario usuario = usuarios.findById(idUsuario)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Usuario no encontrado"
            ));

        if (!Boolean.TRUE.equals(usuario.getActivo())) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "La cuenta se encuentra inactiva"
            );
        }

        return usuario;
    }

    private boolean coincide(String texto, String almacenada) {
        if (texto == null || almacenada == null) {
            return false;
        }

        if (almacenada.matches("^\\$2[aby]\\$\\d{2}\\$.*")) {
            return passwordEncoder.matches(texto, almacenada);
        }

        return almacenada.equals(texto);
    }
}
