package com.lacomarcasoft.controller;

import com.lacomarcasoft.dto.response.PermisoRespuesta;
import com.lacomarcasoft.repository.PermisoRepositorio;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/permisos")
@CrossOrigin(origins = "*")
public class PermisoControlador {

    private final PermisoRepositorio permisoRepositorio;

    public PermisoControlador(
            PermisoRepositorio permisoRepositorio
    ){
        this.permisoRepositorio = permisoRepositorio;
    }

    @GetMapping
        public ResponseEntity<List<PermisoRespuesta>> listarPermisos(){

            return ResponseEntity.ok(

                permisoRepositorio.findAll()
                    .stream()
                    .map(permiso ->
                        new PermisoRespuesta(
                            permiso.getIdPermiso(),
                            permiso.getNombrePermiso(),
                            permiso.getDescripcion()
                        )
                    )
                    .toList()

            );

        }
}
