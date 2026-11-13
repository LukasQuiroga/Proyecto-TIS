
package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.response.ExamenInscritoRespuesta;
import com.lacomarcasoft.modelo.Examen;
import com.lacomarcasoft.modelo.Materia;
import com.lacomarcasoft.modelo.Usuario;
import com.lacomarcasoft.repository.ConsultaExamenEstudianteRepositorio;
import com.lacomarcasoft.repository.ExamenRepositorio;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
public class ConsultaExamenEstudianteServicio {

    private final ConsultaExamenEstudianteRepositorio inscripciones;
    private final ExamenRepositorio examenes;

    public ConsultaExamenEstudianteServicio(
        ConsultaExamenEstudianteRepositorio inscripciones,
        ExamenRepositorio examenes
    ) {
        this.inscripciones = inscripciones;
        this.examenes = examenes;
    }

    @Transactional(readOnly = true)
    public List<ExamenInscritoRespuesta> listar(Long idEstudiante) {
        List<Long> ids = inscripciones.idsExamenesInscritos(idEstudiante);

        if (ids.isEmpty()) {
            return List.of();
        }

        return examenes.findAllById(ids).stream()
            .sorted(Comparator
                .comparing(
                    Examen::getFechaExamen,
                    Comparator.nullsLast(Comparator.naturalOrder())
                )
                .thenComparing(
                    Examen::getHoraInicio,
                    Comparator.nullsLast(Comparator.naturalOrder())
                )
                .thenComparing(Examen::getIdExamen))
            .map(this::convertir)
            .toList();
    }

    private ExamenInscritoRespuesta convertir(Examen examen) {
        Materia materia = examen.getMateria();
        Usuario docente = materia.getDocente();

        String nombreDocente = docente == null
            ? null
            : (docente.getNombre() + " " + docente.getApellido()).trim();

        return new ExamenInscritoRespuesta(
            examen.getIdExamen(),
            examen.getNombreExamen(),
            examen.getCodigo(),
            examen.getTipoEvaluacion(),
            examen.getGestion(),
            examen.getEstado(),
            examen.getDescripcion(),
            materia.getAsignatura().getNombreAsignatura(),
            materia.getGrupo(),
            examen.getFechaExamen(),
            examen.getHoraInicio(),
            examen.getHoraFin(),
            examen.getAula(),
            nombreDocente
        );
    }
}
