package com.lacomarcasoft.controller;


import com.lacomarcasoft.modelo.Rol;

import com.lacomarcasoft.repository.RolRepositorio;


import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;


import java.util.List;

@RestController
@RequestMapping("/api/roles")
@CrossOrigin(origins = "*")
public class RolControlador {

    private final RolRepositorio rolRepositorio;


    public RolControlador(
            RolRepositorio rolRepositorio
    ){

        this.rolRepositorio = rolRepositorio;

    }

    @GetMapping
    public ResponseEntity<List<Rol>> listarRoles(){


        return ResponseEntity.ok(

                rolRepositorio.findAll()

        );

    }

}