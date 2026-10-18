package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.request.ConfigurarExamenSolicitud;
import com.lacomarcasoft.dto.request.RegistrarExamenSolicitud;
import com.lacomarcasoft.dto.response.ExamenRespuesta;
import com.lacomarcasoft.modelo.Examen;
import com.lacomarcasoft.modelo.Materia;
import com.lacomarcasoft.repository.ExamenRepositorio;
import com.lacomarcasoft.repository.MateriaRepositorio;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;

@Service
public class ExamenServicio {

    private static final List<String> TIPOS = List.of(
            "PARCIAL",
            "FINAL",
            "PRACTICO",
            "RECUPERATORIO"
    );

    private static final List<String> ESTADOS = List.of(
            "ACTIVO",
            "PROGRAMADO",
            "EN_PREPARACION",
            "INACTIVO"
    );

    private final ExamenRepositorio examenRepositorio;
    private final MateriaRepositorio materiaRepositorio;

    public ExamenServicio(
            ExamenRepositorio examenRepositorio,
            MateriaRepositorio materiaRepositorio
    ) {
        this.examenRepositorio = examenRepositorio;
        this.materiaRepositorio = materiaRepositorio;
    }

    @Transactional
    public ExamenRespuesta registrar(
            RegistrarExamenSolicitud solicitud
    ) {

        String codigo = validar(solicitud);

        if (examenRepositorio.existeCodigo(codigo)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ya existe un examen con el código " + codigo
            );
        }

        Examen examen = new Examen();

        aplicar(examen, solicitud, codigo);

        return convertir(examenRepositorio.save(examen));
    }

    @Transactional
    public ExamenRespuesta actualizar(
            Long id,
            RegistrarExamenSolicitud solicitud
    ) {

        Examen examen = examenRepositorio
                .obtenerDetalle(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Examen no encontrado"
                        )
                );

        String codigo = validar(solicitud);

        if (examenRepositorio.existeCodigoExcepto(codigo, id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ya existe un examen con el código " + codigo
            );
        }

        aplicar(examen, solicitud, codigo);

        return convertir(examenRepositorio.save(examen));
}



@Transactional
public ExamenRespuesta configurar(
        Long id,
        ConfigurarExamenSolicitud solicitud
) {

        if (solicitud == null ||
                solicitud.fechaExamen() == null ||
                solicitud.horaInicio() == null ||
                solicitud.duracionMinutos() == null) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "La fecha, hora y duración son obligatorias"
        );
        }

        if (solicitud.duracionMinutos() <= 0 ||
                solicitud.duracionMinutos() >= 1440) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "La duración debe ser mayor a cero y menor a 1440 minutos"
        );
        }

        LocalDateTime ahora = LocalDateTime.now(
                ZoneId.of("America/La_Paz")
        );

        if (solicitud.fechaExamen().isBefore(ahora.toLocalDate())) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "La fecha del examen no puede ser anterior a la fecha actual"
        );
        }

        if (solicitud.fechaExamen().isEqual(ahora.toLocalDate()) &&
                !solicitud.horaInicio().isAfter(ahora.toLocalTime())) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "La hora de inicio debe ser posterior a la hora actual"
        );
        }

        LocalTime horaFin = solicitud.horaInicio()
                .plusMinutes(solicitud.duracionMinutos());

        if (!horaFin.isAfter(solicitud.horaInicio())) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "El examen debe finalizar el mismo día"
        );
        }

        Examen examen = examenRepositorio
                .obtenerDetalle(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Examen no encontrado"
                        )
                );

        examen.setFechaExamen(solicitud.fechaExamen());
        examen.setHoraInicio(solicitud.horaInicio());
        examen.setHoraFin(horaFin);

        return convertir(examenRepositorio.save(examen));
}

    @Transactional(readOnly = true)
    public List<ExamenRespuesta> listar(String buscar) {

        List<Examen> examenes;

        if (buscar == null || buscar.isBlank()) {
            examenes = examenRepositorio.listarTodos();
        } else {
            examenes = examenRepositorio.buscar(buscar.trim());
        }

        return examenes.stream()
                .map(this::convertir)
                .toList();
    }

    @Transactional(readOnly = true)
    public ExamenRespuesta obtenerPorId(Long id) {

        Examen examen = examenRepositorio
                .obtenerDetalle(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Examen no encontrado"
                        )
                );

        return convertir(examen);
    }

    private String validar(RegistrarExamenSolicitud solicitud) {

        if (solicitud == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Los datos del examen son obligatorios"
            );
        }

        String codigo = limpiar(solicitud.codigoExamen());
        String nombre = limpiar(solicitud.nombreExamen());
        String gestion = limpiar(solicitud.gestion());
        String tipo = limpiar(solicitud.tipoEvaluacion())
                .toUpperCase(Locale.ROOT);
        String estado = limpiar(solicitud.estado())
                .toUpperCase(Locale.ROOT);

        if (codigo.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El código es obligatorio"
            );
        }

        if (codigo.length() > 30 ||
                !codigo.matches("[A-Za-z0-9_-]+")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El código contiene caracteres no permitidos o supera 30 caracteres"
            );
        }

        if (nombre.length() < 3 || nombre.length() > 120) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El nombre debe tener entre 3 y 120 caracteres"
            );
        }

        if (solicitud.idMateria() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La asignatura es obligatoria"
            );
        }

        if (!TIPOS.contains(tipo)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El tipo de examen no es válido"
            );
        }

        if (gestion.isBlank() || gestion.length() > 20) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La gestión es obligatoria y no puede superar 20 caracteres"
            );
        }

        if (!gestion.matches("\\d{1,2}/\\d{4}")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La gestión debe tener el formato periodo/año, por ejemplo 2/2026"
            );
        }

        if (!ESTADOS.contains(estado)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El estado del examen no es válido"
            );
        }

        String descripcion = limpiar(solicitud.descripcion());

        if (descripcion.length() > 500) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La descripción no puede superar 500 caracteres"
            );
        }

        return codigo;
    }

    private void aplicar(
            Examen examen,
            RegistrarExamenSolicitud solicitud,
            String codigo
    ) {

        Materia materia = materiaRepositorio
                .findById(solicitud.idMateria())
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.BAD_REQUEST,
                                "La asignatura seleccionada no existe"
                        )
                );

        String descripcion = limpiar(solicitud.descripcion());

        examen.setCodigo(codigo);

        examen.setMateria(materia);

        examen.setNombreExamen(limpiar(solicitud.nombreExamen()));

        examen.setTipoEvaluacion(
                limpiar(solicitud.tipoEvaluacion()).toUpperCase(Locale.ROOT)
        );

        examen.setGestion(limpiar(solicitud.gestion()));

        examen.setEstado(
                limpiar(solicitud.estado()).toUpperCase(Locale.ROOT)
        );

        examen.setDescripcion(descripcion.isBlank() ? null : descripcion);
    }


private ExamenRespuesta convertir(Examen examen) {

        Materia materia = examen.getMateria();

        Long idMateria = materia == null
                ? null : materia.getIdMateria();

        String nombreAsignatura =
                (materia != null && materia.getAsignatura() != null)
                        ? materia.getAsignatura().getNombreAsignatura()
                        : null;

        Integer duracionMinutos = null;

        if (examen.getHoraInicio() != null &&
                examen.getHoraFin() != null) {

        duracionMinutos = Math.toIntExact(
                Duration.between(
                        examen.getHoraInicio(),
                        examen.getHoraFin()
                ).toMinutes()
        );
        }

        return new ExamenRespuesta(
                examen.getIdExamen(),
                examen.getCodigo(),
                examen.getNombreExamen(),
                idMateria,
                nombreAsignatura,
                examen.getTipoEvaluacion(),
                examen.getGestion(),
                examen.getEstado(),
                examen.getDescripcion(),
                examen.getFechaExamen(),
                examen.getHoraInicio(),
                examen.getHoraFin(),
                duracionMinutos,
                examen.getAula()
        );
}

    private String limpiar(String valor) {
        return valor == null ? "" : valor.trim();
    }
}
