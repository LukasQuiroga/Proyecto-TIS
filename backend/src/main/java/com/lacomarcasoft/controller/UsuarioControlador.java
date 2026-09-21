package com.lacomarcasoft.controller;


import com.lacomarcasoft.dto.request.ModificarUsuarioSolicitud;

import com.lacomarcasoft.dto.response.UsuarioRespuesta;
import com.lacomarcasoft.modelo.Usuario;

import com.lacomarcasoft.service.UsuarioServicio;


import jakarta.validation.Valid;


import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;


import java.util.List;



@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "*")
public class UsuarioControlador {



    private final UsuarioServicio usuarioServicio;



    public UsuarioControlador(
            UsuarioServicio usuarioServicio
    ){

        this.usuarioServicio = usuarioServicio;

    }


    @GetMapping
    public ResponseEntity<List<UsuarioRespuesta>> listarUsuarios(){


        return ResponseEntity.ok(

                usuarioServicio.listar()

        );

    }

    @GetMapping("/{id}")
    public ResponseEntity<UsuarioRespuesta> obtenerUsuario(

            @PathVariable Long id

    ){
    

        return ResponseEntity.ok(

                usuarioServicio.buscarRespuesta(id)

        );

    }

    @PutMapping("/{id}")
    public ResponseEntity<Usuario> modificarUsuario(

            @PathVariable Long id,

            @Valid
            @RequestBody ModificarUsuarioSolicitud solicitud

    ){

        Usuario datos = new Usuario();

        datos.setNombre(
                solicitud.nombre()
        );

        datos.setApellido(
                solicitud.apellido()
        );

        datos.setCorreo(
                solicitud.correo()
        );

        datos.setContrasena(
                solicitud.contrasena()
        );

        datos.setActivo(
                solicitud.activo()
        );


        Usuario actualizado =

                usuarioServicio.modificar(

                        id,

                        datos,

                        solicitud.idRol()

                );


        return ResponseEntity.ok(

                actualizado

        );

    }


}