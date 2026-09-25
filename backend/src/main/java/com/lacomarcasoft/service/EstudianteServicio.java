package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.response.ConsultaEstudiantesRespuesta;
import com.lacomarcasoft.dto.response.EstudianteRespuesta;
import com.lacomarcasoft.repository.EstudianteRepositorio;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class EstudianteServicio {

    private static final int TAMANIO_MAXIMO = 100;

    private final EstudianteRepositorio estudianteRepositorio;

    public EstudianteServicio(
            EstudianteRepositorio estudianteRepositorio
    ) {
        this.estudianteRepositorio = estudianteRepositorio;
    }

    public ConsultaEstudiantesRespuesta consultar(
            String busqueda,
            String estado,
            String carrera,
            int pagina,
            int tamanio
    ) {

        int paginaSegura = Math.max(pagina, 0);

        int tamanioSeguro = Math.min(
                Math.max(tamanio, 1),
                TAMANIO_MAXIMO
        );

        Boolean activo = convertirEstado(estado);

        String carreraNormalizada =
                normalizarFiltro(carrera, "todas");

        List<EstudianteRespuesta> estudiantes =
                estudianteRepositorio.consultar(
                        normalizarTexto(busqueda),
                        activo,
                        carreraNormalizada,
                        paginaSegura,
                        tamanioSeguro
                );

        long total = estudianteRepositorio.contar(
                normalizarTexto(busqueda),
                activo,
                carreraNormalizada
        );

        int totalPaginas = total == 0
                ? 0
                : (int) Math.ceil(
                        (double) total / tamanioSeguro
                );

        return new ConsultaEstudiantesRespuesta(
                estudiantes,
                total,
                paginaSegura,
                tamanioSeguro,
                totalPaginas
        );
    }

    public EstudianteRespuesta buscarPorId(
            Long idUsuario
    ) {

        return estudianteRepositorio
                .buscarPorId(idUsuario)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Estudiante no encontrado"
                        )
                );
    }

    public List<String> listarCarreras() {
        return estudianteRepositorio.listarCarreras();
    }

    private Boolean convertirEstado(String estado) {

        if (
                estado == null
                || estado.isBlank()
                || estado.equalsIgnoreCase("todos")
        ) {
            return null;
        }

        if (estado.equalsIgnoreCase("activo")) {
            return true;
        }

        if (estado.equalsIgnoreCase("inactivo")) {
            return false;
        }

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "El estado debe ser TODOS, ACTIVO o INACTIVO"
        );
    }

    private String normalizarFiltro(
            String valor,
            String valorTodos
    ) {

        if (
                valor == null
                || valor.isBlank()
                || valor.equalsIgnoreCase(valorTodos)
        ) {
            return null;
        }

        return valor.trim();
    }

    private String normalizarTexto(String valor) {

        return valor == null || valor.isBlank()
                ? null
                : valor.trim();
    }
}