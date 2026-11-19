
package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.response.EstudianteExamenExpulsionRespuesta;
import com.lacomarcasoft.modelo.Usuario;
import com.lacomarcasoft.repository.ExamenRepositorio;
import com.lacomarcasoft.repository.ExpulsionRepositorio;
import com.lacomarcasoft.repository.UsuarioRepositorio;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class EstudiantesExamenExpulsionServicio {

    private final JdbcTemplate jdbc;
    private final ExamenRepositorio examenes;
    private final UsuarioRepositorio usuarios;
    private final ExpulsionRepositorio expulsiones;

    public EstudiantesExamenExpulsionServicio(
            JdbcTemplate jdbc,
            ExamenRepositorio examenes,
            UsuarioRepositorio usuarios,
            ExpulsionRepositorio expulsiones) {
        this.jdbc = jdbc;
        this.examenes = examenes;
        this.usuarios = usuarios;
        this.expulsiones = expulsiones;
    }

    @Transactional(readOnly = true)
    public List<EstudianteExamenExpulsionRespuesta> listar(Long idExamen) {

        if (idExamen == null || idExamen <= 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Identificador de examen invalido"
            );
        }

        if (!examenes.existsById(idExamen)) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Examen no encontrado"
            );
        }

        List<Long> idsEstudiantes = jdbc.queryForList(
            """
            SELECT DISTINCT id_estudiante
            FROM academico.examen_estudiante
            WHERE id_examen = ?
            ORDER BY id_estudiante
            """,
            Long.class,
            idExamen
        );

        if (idsEstudiantes.isEmpty()) {
            return List.of();
        }

        Map<Long, Usuario> usuariosPorId = usuarios
            .findAllById(idsEstudiantes)
            .stream()
            .collect(Collectors.toMap(
                Usuario::getIdUsuario,
                Function.identity()
            ));

        Set<Long> idsExpulsados = expulsiones
            .findByExamen_IdExamenOrderByFechaHoraExpulsionDesc(idExamen)
            .stream()
            .map(expulsion -> expulsion.getEstudiante().getIdUsuario())
            .collect(Collectors.toSet());

        return idsEstudiantes.stream()
            .map(usuariosPorId::get)
            .filter(Objects::nonNull)
            .map(usuario -> {
                String nombreCompleto = Stream.of(
                    usuario.getNombre(),
                    usuario.getApellido()
                )
                .filter(valor -> valor != null && !valor.isBlank())
                .collect(Collectors.joining(" "));

                String codigoUniversitario =
                    usuario.getCodigoSis() == null
                        ? ""
                        : String.valueOf(usuario.getCodigoSis());

                return new EstudianteExamenExpulsionRespuesta(
                    usuario.getIdUsuario(),
                    nombreCompleto,
                    codigoUniversitario,
                    idsExpulsados.contains(usuario.getIdUsuario())
                );
            })
            .toList();
    }
}
