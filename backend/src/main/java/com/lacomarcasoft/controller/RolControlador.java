package com.lacomarcasoft.controller;

import com.lacomarcasoft.dto.request.ActualizarPermisosSolicitud;
import com.lacomarcasoft.dto.response.RolRespuesta;
import com.lacomarcasoft.modelo.Rol;
import com.lacomarcasoft.service.RolServicio;
import com.lacomarcasoft.dto.request.CrearRolSolicitud;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
@CrossOrigin(origins = "*")
public class RolControlador {

    private final RolServicio rolServicio;


    public RolControlador(
            RolServicio rolServicio
    ){

        this.rolServicio = rolServicio;

    }


    @GetMapping
    public ResponseEntity<List<RolRespuesta>> listarRoles(){

        return ResponseEntity.ok(
                rolServicio.listar()
        );
    }


    @GetMapping("/{id}")
    public ResponseEntity<RolRespuesta> obtenerRol(
            @PathVariable Long id
    ){

        return ResponseEntity.ok(
                rolServicio.buscarRespuesta(id)
        );
    }

    @PostMapping
        public ResponseEntity<RolRespuesta> crearRol(
                @RequestBody CrearRolSolicitud solicitud
        ){

        return ResponseEntity.ok(
                rolServicio.crear(
                        solicitud
                )
        );

    }

    @PutMapping("/{id}/permisos")
    public ResponseEntity<RolRespuesta> actualizarPermisos(
            @PathVariable Long id,
            @RequestBody ActualizarPermisosSolicitud solicitud
    ){

        Rol rol =
                rolServicio.actualizarPermisos(
                        id,
                        solicitud.permisos()
                );


        return ResponseEntity.ok(
                rolServicio.buscarRespuesta(
                        rol.getIdRol()
                )
        );

    }

}