package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.request.RegistrarAsignaturaSolicitud;
import com.lacomarcasoft.dto.response.AsignaturaRespuesta;
import com.lacomarcasoft.modelo.Asignatura;
import com.lacomarcasoft.modelo.AsignaturaCarrera;
import com.lacomarcasoft.repository.AsignaturaRepositorio;
import com.lacomarcasoft.repository.AsignaturaCarreraRepositorio;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class AsignaturaServicio {

    private final AsignaturaRepositorio asignaturaRepositorio;
    private final AsignaturaCarreraRepositorio asignaturaCarreraRepositorio;

    public AsignaturaServicio(
            AsignaturaRepositorio asignaturaRepositorio,
            AsignaturaCarreraRepositorio asignaturaCarreraRepositorio
    ) {
        this.asignaturaRepositorio = asignaturaRepositorio;
        this.asignaturaCarreraRepositorio = asignaturaCarreraRepositorio;
    }

    @Transactional
    public AsignaturaRespuesta registrar(
            RegistrarAsignaturaSolicitud solicitud
    ) {

        if (solicitud == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Los datos de la asignatura son obligatorios"
            );
        }

        String codigo = limpiar(solicitud.codigoAsignatura());
        String nombre = limpiar(solicitud.nombreAsignatura());

        if (codigo.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El codigo es obligatorio"
            );
        }

        if (codigo.length() > 30 ||
                !codigo.matches("[A-Za-z0-9_-]+")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El codigo contiene caracteres no permitidos o supera 30 caracteres"
            );
        }

        if (nombre.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El nombre de la asignatura es obligatorio"
            );
        }

        if (nombre.length() < 3 || nombre.length() > 120) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El nombre debe tener entre 3 y 120 caracteres"
            );
        }

        Short semestre = solicitud.semestre();

        if (semestre == null || semestre < 1 || semestre > 10) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El semestre debe estar entre 1 y 10"
            );
        }

        List<String> carreras = normalizarCarreras(
                solicitud.carreras()
        );

        if (asignaturaRepositorio.existeCodigo(codigo)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ya existe una asignatura con el codigo " + codigo
            );
        }

        for (String carrera : carreras) {

            if (asignaturaRepositorio.existeNombreEnCarrera(
                    nombre,
                    carrera
            )) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Ya existe una asignatura con el nombre "
                                + nombre + " en la carrera " + carrera
                );
            }
        }

        Asignatura asignatura = new Asignatura();

        asignatura.setCodigoAsignatura(codigo);
        asignatura.setNombreAsignatura(nombre);
        asignatura.setSemestre(semestre);

        asignatura.setActivo(
                solicitud.activo() == null
                        ? true
                        : solicitud.activo()
        );

        String descripcion = limpiar(solicitud.descripcion());

        asignatura.setDescripcion(
                descripcion.isBlank() ? null : descripcion
        );

        Asignatura guardada = asignaturaRepositorio.save(
                asignatura
        );

        List<AsignaturaCarrera> relaciones = new ArrayList<>();

        for (String carrera : carreras) {
            relaciones.add(
                    new AsignaturaCarrera(
                            guardada.getIdAsignatura(),
                            carrera
                    )
            );
        }

        asignaturaCarreraRepositorio.saveAll(relaciones);

        return new AsignaturaRespuesta(
                guardada.getIdAsignatura(),
                guardada.getCodigoAsignatura(),
                guardada.getNombreAsignatura(),
                guardada.getSemestre(),
                guardada.getActivo(),
                guardada.getDescripcion(),
                carreras
        );
    }

    private String limpiar(String valor) {
        return valor == null ? "" : valor.trim();
    }

    private List<String> normalizarCarreras(List<String> carreras) {

        if (carreras == null || carreras.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Debe seleccionar al menos una carrera"
            );
        }

        Map<String, String> unicas = new LinkedHashMap<>();

        for (String valor : carreras) {

            String carrera = limpiar(valor);

            if (carrera.isBlank()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "La carrera no puede estar vacia"
                );
            }

            if (carrera.length() > 120) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "El nombre de la carrera no puede superar 120 caracteres"
                );
            }

            String clave = carrera.toLowerCase(Locale.ROOT);

            if (unicas.containsKey(clave)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "La carrera " + carrera + " esta repetida"
                );
            }

            unicas.put(clave, carrera);
        }

        return new ArrayList<>(unicas.values());
    }
}