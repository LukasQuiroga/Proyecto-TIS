package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.response.PermisoRespuesta;
import com.lacomarcasoft.dto.response.RolRespuesta;
import com.lacomarcasoft.modelo.Rol;
import com.lacomarcasoft.repository.RolRepositorio;

import org.springframework.stereotype.Service;

import java.util.List;


@Service
public class RolServicio {

    private final RolRepositorio rolRepositorio;


    public RolServicio(
            RolRepositorio rolRepositorio
    ){

        this.rolRepositorio = rolRepositorio;

    }


    public List<RolRespuesta> listar(){

        return rolRepositorio.findAll()
                .stream()
                .map(this::convertirRespuesta)
                .toList();

    }


    public Rol buscar(Long id){

        return rolRepositorio.findById(id)
                .orElseThrow(
                        () -> new RuntimeException(
                                "Rol no encontrado"
                        )
                );

    }


    public RolRespuesta buscarRespuesta(Long id){

        return convertirRespuesta(
                buscar(id)
        );

    }


    private RolRespuesta convertirRespuesta(
            Rol rol
    ){

        return new RolRespuesta(

                rol.getIdRol(),

                rol.getNombreRol(),

                rol.getDescripcionRol(),

                rol.getPermisos()
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