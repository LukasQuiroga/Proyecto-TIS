package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.response.PermisoRespuesta;
import com.lacomarcasoft.dto.response.RolRespuesta;
import com.lacomarcasoft.modelo.Permiso;
import com.lacomarcasoft.modelo.Rol;
import com.lacomarcasoft.repository.PermisoRepositorio;
import com.lacomarcasoft.repository.RolRepositorio;

import org.springframework.stereotype.Service;

import java.util.List;


@Service
public class RolServicio {

    private final RolRepositorio rolRepositorio;
    private final PermisoRepositorio permisoRepositorio;


    public RolServicio(
            RolRepositorio rolRepositorio,
            PermisoRepositorio permisoRepositorio
    ){

        this.rolRepositorio = rolRepositorio;
        this.permisoRepositorio = permisoRepositorio;

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
    public Rol actualizarPermisos(
        Long idRol,
        List<Long> idsPermisos
    ){

        Rol rol = buscar(idRol);


        List<Permiso> permisos =
                permisoRepositorio.findAllById(idsPermisos);


        rol.setPermisos(
                permisos
        );


        return rolRepositorio.save(rol);

     }

}