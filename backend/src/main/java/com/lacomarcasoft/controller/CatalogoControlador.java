package com.lacomarcasoft.controller;

import com.lacomarcasoft.dto.response.CarreraRespuesta;
import com.lacomarcasoft.dto.response.FacultadRespuesta;
import com.lacomarcasoft.service.CatalogoServicio;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class CatalogoControlador {

    private final CatalogoServicio catalogoServicio;

    public CatalogoControlador(
            CatalogoServicio catalogoServicio
    ){
        this.catalogoServicio = catalogoServicio;
    }

    @GetMapping("/facultades")
    public ResponseEntity<List<FacultadRespuesta>> listarFacultades(){

        return ResponseEntity.ok(
                catalogoServicio.listarFacultades()
        );

    }

    @GetMapping("/carreras")
    public ResponseEntity<List<CarreraRespuesta>> listarCarreras(){

        return ResponseEntity.ok(
                catalogoServicio.listarCarreras()
        );

    }

}
