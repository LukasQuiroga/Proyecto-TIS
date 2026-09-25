package com.lacomarcasoft.service;


import com.lacomarcasoft.dto.response.UsuarioRespuesta;
import com.lacomarcasoft.modelo.Rol;
import com.lacomarcasoft.modelo.Usuario;

import com.lacomarcasoft.repository.RolRepositorio;
import com.lacomarcasoft.repository.UsuarioRepositorio;

import org.springframework.stereotype.Service;


import java.util.List;



@Service
public class UsuarioServicio {

    private final UsuarioRepositorio usuarioRepositorio;

    private final RolRepositorio rolRepositorio;


    public UsuarioServicio(
            UsuarioRepositorio usuarioRepositorio,
            RolRepositorio rolRepositorio
    ){

        this.usuarioRepositorio = usuarioRepositorio;
        this.rolRepositorio = rolRepositorio;

    }

    public List<UsuarioRespuesta> listar(){

        return usuarioRepositorio.findAll()

                .stream()

                .map(this::convertirRespuesta)

                .toList();

    }


    public Usuario buscar(Long id){


        return usuarioRepositorio.findById(id)

                .orElseThrow(

                        () -> new RuntimeException(
                                "Usuario no encontrado"
                        )

                );

    }

    public UsuarioRespuesta buscarRespuesta(Long id){

        return convertirRespuesta(
                buscar(id)
        );

    }

    public Usuario modificar(

            Long id,

            Usuario datos,

            Long idRol

    ){
    

        Usuario usuario = buscar(id);

        Rol rol =

                rolRepositorio.findById(idRol)

                .orElseThrow(

                        () -> new RuntimeException(
                                "Rol no encontrado"
                        )

                );

        usuario.setNombre(
                datos.getNombre()
        );

        usuario.setApellido(
                datos.getApellido()
        );

        usuario.setCorreo(
                datos.getCorreo()
        );

        usuario.setContrasena(
                datos.getContrasena()
        );

        usuario.setActivo(
                datos.getActivo()
        );

        usuario.setRol(
                rol
        );

        return usuarioRepositorio.save(usuario);

    }

        private UsuarioRespuesta convertirRespuesta(
                Usuario usuario
        ){

        List<String> permisos =
                usuario.getRol()
                        .getPermisos()
                        .stream()
                        .map(permiso ->
                                permiso.getNombrePermiso()
                        )
                        .toList();

        return new UsuarioRespuesta(

                usuario.getIdUsuario(),
                usuario.getNombre(),
                usuario.getApellido(),
                usuario.getCorreo(),
                usuario.getRol().getIdRol(),
                usuario.getRol().getNombreRol(),
                usuario.getActivo(),
                permisos

        );

        }

}