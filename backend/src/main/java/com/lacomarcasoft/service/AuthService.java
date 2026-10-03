package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.request.LoginRequest;
import com.lacomarcasoft.dto.response.LoginRespuesta;
import com.lacomarcasoft.dto.response.UsuarioRespuesta;
import com.lacomarcasoft.modelo.Usuario;
import com.lacomarcasoft.repository.UsuarioRepositorio;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuthService {

    private final UsuarioRepositorio usuarioRepositorio;

    public AuthService(UsuarioRepositorio usuarioRepositorio){
        this.usuarioRepositorio=usuarioRepositorio;
    }

    public LoginRespuesta login(LoginRequest request){

        Usuario usuario=usuarioRepositorio
            .findByCorreo(request.correo())
            .orElseThrow(
                ()->new RuntimeException("Credenciales incorrectas")
            );

        if(!usuario.getActivo()){
            throw new RuntimeException("Usuario inactivo");
        }

        if(!usuario.getContrasena().equals(request.password())){
            throw new RuntimeException("Credenciales incorrectas");
        }

        UsuarioRespuesta respuesta=new UsuarioRespuesta(
            usuario.getIdUsuario(),
            usuario.getNombre(),
            usuario.getApellido(),
            usuario.getCarnetIdentidad(),
            usuario.getCorreo(),
            usuario.getCelular(),
            usuario.getCarrera(),
            usuario.getCodigoSis(),
            usuario.getRol().getIdRol(),
            usuario.getRol().getNombreRol(),
            usuario.getActivo(),
            usuario.getFechaCreacion(),
            usuario.getRol()
                .getPermisos()
                .stream()
                .map(permiso->permiso.getNombrePermiso())
                .toList(),
            List.of()
        );

        return new LoginRespuesta(respuesta);
    }

    public List<String> obtenerPermisosActuales(Long idUsuario){
        Usuario usuario = usuarioRepositorio
                .findById(idUsuario)
                .orElseThrow(
                        () -> new RuntimeException(
                                "Usuario no encontrado"
                        )
                );
        return usuario.getRol()
                .getPermisos()
                .stream()
                .map(permiso -> permiso.getNombrePermiso())
                .toList();
    }
}