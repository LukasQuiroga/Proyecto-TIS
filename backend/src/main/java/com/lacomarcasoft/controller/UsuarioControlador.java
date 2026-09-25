package com.lacomarcasoft.controller;


import com.lacomarcasoft.dto.request.ModificarUsuarioSolicitud;

import com.lacomarcasoft.dto.response.UsuarioRespuesta;
import com.lacomarcasoft.modelo.Usuario;

import com.lacomarcasoft.service.LogActividadServicio;
import com.lacomarcasoft.service.UsuarioServicio;


import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;


import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;


import java.util.List;



@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "*")
public class UsuarioControlador {



    private static final Logger LOG =
            LoggerFactory.getLogger(
                    UsuarioControlador.class
            );



    private final UsuarioServicio usuarioServicio;

    private final LogActividadServicio logActividadServicio;



    public UsuarioControlador(
            UsuarioServicio usuarioServicio,
            LogActividadServicio logActividadServicio
    ){

        this.usuarioServicio = usuarioServicio;

        this.logActividadServicio = logActividadServicio;

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

            @RequestHeader(
                    value = "X-Usuario-Id",
                    required = false
            )
            Long idUsuarioResponsable,

            @Valid
            @RequestBody ModificarUsuarioSolicitud solicitud,

            HttpServletRequest request

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

        registrarAuditoria(
                idUsuarioResponsable,
                id,
                request
        );


        return ResponseEntity.ok(

                actualizado

        );

    }

    private void registrarAuditoria(
            Long idUsuarioResponsable,
            Long idUsuarioModificado,
            HttpServletRequest request
    ) {

        try {

            logActividadServicio.registrar(
                    idUsuarioResponsable,
                    "MODIFICAR_USUARIO",
                    "Se modificó el usuario con id " +
                            idUsuarioModificado,
                    request.getRemoteAddr(),
                    true
            );

        } catch (Exception e) {

            LOG.error(
                    "No se pudo registrar la auditoría",
                    e
            );

        }

    }


}