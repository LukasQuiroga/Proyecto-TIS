package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.response.CarreraRespuesta;
import com.lacomarcasoft.dto.response.FacultadRespuesta;
import com.lacomarcasoft.modelo.Carrera;
import com.lacomarcasoft.modelo.Facultad;
import com.lacomarcasoft.repository.CarreraRepositorio;
import com.lacomarcasoft.repository.FacultadRepositorio;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CatalogoServicio {

    private final FacultadRepositorio facultadRepositorio;
    private final CarreraRepositorio carreraRepositorio;

    public CatalogoServicio(
            FacultadRepositorio facultadRepositorio,
            CarreraRepositorio carreraRepositorio
    ){
        this.facultadRepositorio = facultadRepositorio;
        this.carreraRepositorio = carreraRepositorio;
    }

    public List<FacultadRespuesta> listarFacultades(){

        return facultadRepositorio
                .findAllByOrderByNombreAsc()
                .stream()
                .map(this::convertirFacultad)
                .toList();

    }

    public List<CarreraRespuesta> listarCarreras(){

        return carreraRepositorio
                .findAllByOrderByNombreAsc()
                .stream()
                .map(this::convertirCarrera)
                .toList();

    }

    private FacultadRespuesta convertirFacultad(
            Facultad facultad
    ){

        List<CarreraRespuesta> carreras =
                carreraRepositorio
                        .findAllByOrderByNombreAsc()
                        .stream()
                        .filter(
                                carrera ->
                                        carrera.getFacultad()
                                                .getIdFacultad()
                                                .equals(
                                                        facultad.getIdFacultad()
                                                )
                        )
                        .map(this::convertirCarrera)
                        .toList();

        return new FacultadRespuesta(
                facultad.getIdFacultad(),
                facultad.getCodigo(),
                facultad.getNombre(),
                carreras
        );

    }

    private CarreraRespuesta convertirCarrera(
            Carrera carrera
    ){

        return new CarreraRespuesta(
                carrera.getIdCarrera(),
                carrera.getNombre(),
                carrera.getFacultad().getIdFacultad(),
                carrera.getFacultad().getCodigo(),
                carrera.getFacultad().getNombre()
        );

    }

}
