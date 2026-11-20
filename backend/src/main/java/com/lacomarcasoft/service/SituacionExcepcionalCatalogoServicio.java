package com.lacomarcasoft.service;

import com.lacomarcasoft.modelo.Examen;
import com.lacomarcasoft.modelo.Usuario;
import com.lacomarcasoft.repository.ConsultaExamenEstudianteRepositorio;
import com.lacomarcasoft.repository.ExamenRepositorio;
import com.lacomarcasoft.repository.UsuarioRepositorio;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;

@Service
public class SituacionExcepcionalCatalogoServicio {

    private final ExamenRepositorio examenRepositorio;
    private final UsuarioRepositorio usuarioRepositorio;
    private final ConsultaExamenEstudianteRepositorio consultaExamenEstudianteRepositorio;

    public record ExamenOpcion(
            Long idExamen,
            String nombreExamen
    ) {
    }

    public record EstudianteOpcion(
            Long idEstudiante,
            String nombreEstudiante
    ) {
    }

    public SituacionExcepcionalCatalogoServicio(
            ExamenRepositorio examenRepositorio,
            UsuarioRepositorio usuarioRepositorio,
            ConsultaExamenEstudianteRepositorio consultaExamenEstudianteRepositorio
    ) {
        this.examenRepositorio = examenRepositorio;
        this.usuarioRepositorio = usuarioRepositorio;
        this.consultaExamenEstudianteRepositorio =
                consultaExamenEstudianteRepositorio;
    }

    @Transactional(readOnly = true)
    public List<ExamenOpcion> listarExamenes() {
        return examenRepositorio.findAll()
                .stream()
                .map(examen -> new ExamenOpcion(
                        examen.getIdExamen(),
                        examen.getNombreExamen()
                ))
                .sorted(Comparator.comparing(
                        ExamenOpcion::nombreExamen,
                        String.CASE_INSENSITIVE_ORDER
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EstudianteOpcion> listarEstudiantes(Long idExamen) {
        if (idExamen == null || idExamen <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Identificador de examen invalido"
            );
        }

        if (!examenRepositorio.existsById(idExamen)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Examen no encontrado"
            );
        }

        return usuarioRepositorio.findAll()
                .stream()
                .filter(usuario ->
                        consultaExamenEstudianteRepositorio.existeInscripcion(
                                idExamen,
                                usuario.getIdUsuario()
                        )
                )
                .map(usuario -> new EstudianteOpcion(
                        usuario.getIdUsuario(),
                        usuario.getNombre() + " " + usuario.getApellido()
                ))
                .sorted(Comparator.comparing(
                        EstudianteOpcion::nombreEstudiante,
                        String.CASE_INSENSITIVE_ORDER
                ))
                .toList();
    }
}
