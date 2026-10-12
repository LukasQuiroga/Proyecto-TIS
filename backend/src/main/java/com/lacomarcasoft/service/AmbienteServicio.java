package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.request.ActualizarAmbienteSolicitud;
import com.lacomarcasoft.dto.request.RegistrarAmbienteSolicitud;
import com.lacomarcasoft.dto.response.AmbienteRespuesta;
import com.lacomarcasoft.dto.response.DisponibilidadAmbienteRespuesta;
import com.lacomarcasoft.modelo.Ambiente;
import com.lacomarcasoft.repository.AmbienteRepositorio;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Locale;

@Service
public class AmbienteServicio {

    private final AmbienteRepositorio ambienteRepositorio;

    public AmbienteServicio(
            AmbienteRepositorio ambienteRepositorio
    ) {
        this.ambienteRepositorio = ambienteRepositorio;
    }

    @Transactional
    public AmbienteRespuesta registrar(
            RegistrarAmbienteSolicitud solicitud
    ) {
        if (solicitud == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Los datos del ambiente son obligatorios"
            );
        }

        String codigo = normalizarCodigo(solicitud.codigo());
        String nombre = limpiar(solicitud.nombre());
        String ubicacion = limpiar(solicitud.ubicacion());

        validarDatos(
                codigo,
                nombre,
                solicitud.capacidad(),
                ubicacion,
                solicitud.disponible()
        );

        if (ambienteRepositorio.existeCodigo(codigo)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ya existe un ambiente con el codigo " + codigo
            );
        }

        Ambiente ambiente = new Ambiente();

        ambiente.setCodigo(codigo);
        ambiente.setNombre(nombre);
        ambiente.setCapacidad(solicitud.capacidad());
        ambiente.setUbicacion(ubicacion);
        ambiente.setDisponible(solicitud.disponible());

        Ambiente guardado = ambienteRepositorio.save(ambiente);

        return convertirRespuesta(guardado);
    }

    @Transactional(readOnly = true)
    public List<AmbienteRespuesta> listar(
            String buscar,
            Boolean disponible
    ) {
        List<Ambiente> ambientes;

        if (buscar == null || buscar.isBlank()) {
            ambientes = ambienteRepositorio.findAllByOrderByCodigoAsc();
        } else {
            ambientes = ambienteRepositorio.buscar(buscar.trim());
        }

        return ambientes.stream()
                .filter(ambiente ->
                        disponible == null ||
                        ambiente.getDisponible().equals(disponible)
                )
                .map(this::convertirRespuesta)
                .toList();
    }

    @Transactional(readOnly = true)
    public AmbienteRespuesta obtenerPorId(Long id) {
        return convertirRespuesta(buscarPorId(id));
    }

    @Transactional(readOnly = true)
    public DisponibilidadAmbienteRespuesta verificarDisponibilidad(
            Long id,
            LocalDate fecha,
            LocalTime horaInicio,
            LocalTime horaFin,
            Long idExamenExcluir
    ) {
        Ambiente ambiente = buscarPorId(id);

        if (!Boolean.TRUE.equals(ambiente.getDisponible())) {
            return new DisponibilidadAmbienteRespuesta(
                    ambiente.getIdAmbiente(),
                    false,
                    "El ambiente se encuentra marcado como no disponible"
            );
        }

        if (fecha == null || horaInicio == null || horaFin == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La fecha, hora de inicio y hora de fin son obligatorias"
            );
        }

        if (!horaFin.isAfter(horaInicio)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La hora de fin debe ser posterior a la hora de inicio"
            );
        }

        boolean conflicto =
                ambienteRepositorio.existeConflictoHorario(
                        id,
                        fecha,
                        horaInicio,
                        horaFin,
                        idExamenExcluir
                );

        return new DisponibilidadAmbienteRespuesta(
                ambiente.getIdAmbiente(),
                !conflicto,
                conflicto
                        ? "El ambiente ya se encuentra asignado a otro examen en ese horario"
                        : "El ambiente se encuentra disponible para el horario indicado"
        );
    }

    @Transactional
    public AmbienteRespuesta actualizar(
            Long id,
            ActualizarAmbienteSolicitud solicitud
    ) {
        if (solicitud == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Los datos del ambiente son obligatorios"
            );
        }

        Ambiente ambiente = buscarPorId(id);

        String codigo = normalizarCodigo(solicitud.codigo());
        String nombre = limpiar(solicitud.nombre());
        String ubicacion = limpiar(solicitud.ubicacion());

        validarDatos(
                codigo,
                nombre,
                solicitud.capacidad(),
                ubicacion,
                solicitud.disponible()
        );

        if (ambienteRepositorio.existeCodigoEnOtroAmbiente(
                codigo,
                id
        )) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ya existe otro ambiente con el codigo " + codigo
            );
        }

        ambiente.setCodigo(codigo);
        ambiente.setNombre(nombre);
        ambiente.setCapacidad(solicitud.capacidad());
        ambiente.setUbicacion(ubicacion);
        ambiente.setDisponible(solicitud.disponible());

        Ambiente actualizado =
                ambienteRepositorio.save(ambiente);

        return convertirRespuesta(actualizado);
    }

    private Ambiente buscarPorId(Long id) {
        if (id == null || id <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El identificador del ambiente no es valido"
            );
        }

        return ambienteRepositorio.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Ambiente no encontrado"
                        )
                );
    }

    private void validarDatos(
            String codigo,
            String nombre,
            Integer capacidad,
            String ubicacion,
            Boolean disponible
    ) {
        if (codigo.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El codigo del ambiente es obligatorio"
            );
        }

        if (
                codigo.length() > 30 ||
                !codigo.matches("[A-Za-z0-9_-]+")
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El codigo solo puede contener letras, numeros, guion o guion bajo y no superar 30 caracteres"
            );
        }

        if (nombre.length() < 3 || nombre.length() > 100) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El nombre debe tener entre 3 y 100 caracteres"
            );
        }

        if (capacidad == null || capacidad <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La capacidad debe ser mayor a 0"
            );
        }

        if (ubicacion.length() < 3 || ubicacion.length() > 150) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La ubicacion debe tener entre 3 y 150 caracteres"
            );
        }

        if (disponible == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El estado del ambiente es obligatorio"
            );
        }
    }

    private AmbienteRespuesta convertirRespuesta(
            Ambiente ambiente
    ) {
        return new AmbienteRespuesta(
                ambiente.getIdAmbiente(),
                ambiente.getCodigo(),
                ambiente.getNombre(),
                ambiente.getCapacidad(),
                ambiente.getUbicacion(),
                ambiente.getDisponible(),
                ambiente.getFechaCreacion(),
                ambiente.getFechaActualizacion()
        );
    }

    private String limpiar(String valor) {
        return valor == null
                ? ""
                : valor.trim();
    }

    private String normalizarCodigo(String valor) {
        return limpiar(valor)
                .toUpperCase(Locale.ROOT);
    }
}