package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.request.ActualizarUsuarioSolicitud;
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

    public boolean codigoSisDisponible(
            String codigoSis
    ){

        if(codigoSis == null || codigoSis.isBlank()){

            throw new RuntimeException(
                    "El código SIS es obligatorio"
            );

        }

        return usuarioRepositorio
                .findByCodigoSis(codigoSis)
                .isEmpty();

    }

    public UsuarioRespuesta buscarRespuesta(Long id){

        return convertirRespuesta(
                buscar(id)
        );

    }

    public Usuario modificar(
            Long id,
            ActualizarUsuarioSolicitud datos
    ){


        if(datos.nombre() == null || datos.nombre().isBlank()){

            throw new RuntimeException(
                    "El nombre es obligatorio"
            );

        }


        if(datos.apellido() == null || datos.apellido().isBlank()){

            throw new RuntimeException(
                    "El apellido es obligatorio"
            );

        }


        if(datos.carnetIdentidad() == null || datos.carnetIdentidad().isBlank()){

            throw new RuntimeException(
                    "El carnet de identidad es obligatorio"
            );

        }


        if(datos.correo() == null || datos.correo().isBlank()){

            throw new RuntimeException(
                    "El correo es obligatorio"
            );

        }


        Usuario usuarioExistenteCorreo =
                usuarioRepositorio.findByCorreo(
                        datos.correo()
                )
                .orElse(null);


        if(usuarioExistenteCorreo != null &&
                !usuarioExistenteCorreo.getIdUsuario().equals(id)){

            throw new RuntimeException(
                    "El correo ya está registrado"
            );

        }


        Usuario usuarioExistenteCarnet =
                usuarioRepositorio.findByCarnetIdentidad(
                        datos.carnetIdentidad()
                )
                .orElse(null);


        if(usuarioExistenteCarnet != null &&
                !usuarioExistenteCarnet.getIdUsuario().equals(id)){

            throw new RuntimeException(
                    "El carnet de identidad ya está registrado"
            );

        }

        Usuario usuario = buscar(id);

        Rol rol =
                rolRepositorio.findById(datos.idRol())
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Rol no encontrado"
                                )
                        );


        usuario.setNombre(
                datos.nombre()
        );


        usuario.setApellido(
                datos.apellido()
        );


        usuario.setCarnetIdentidad(
                datos.carnetIdentidad()
        );


        usuario.setCorreo(
                datos.correo()
        );


        usuario.setActivo(
                datos.activo()
        );


        usuario.setRol(
                rol
        );

        return usuarioRepositorio.save(usuario);

    }

    public Usuario cambiarRol(
            Long idUsuario,
            Long idRol
    ){

        Usuario usuario = buscar(idUsuario);

        Rol rol =
                rolRepositorio.findById(idRol)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Rol no encontrado"
                                )
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
                        .map(
                                permiso ->
                                        permiso.getNombrePermiso()
                        )
                        .toList();


        return new UsuarioRespuesta(

                usuario.getIdUsuario(),

                usuario.getNombre(),

                usuario.getApellido(),

                usuario.getCarnetIdentidad(),

                usuario.getCorreo(),

                usuario.getRol().getIdRol(),

                usuario.getRol().getNombreRol(),

                usuario.getActivo(),

                permisos

        );

    }

}