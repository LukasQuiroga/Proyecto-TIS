package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.response.ConsultaLogsRespuesta;
import com.lacomarcasoft.dto.response.LogActividadRespuesta;
import com.lacomarcasoft.repository.LogActividadRepositorio;
import com.lacomarcasoft.repository.UsuarioRepositorio;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@Service
public class LogActividadServicio {

    private static final int TAMANIO_MAXIMO = 100;

    private final LogActividadRepositorio logActividadRepositorio;
    private final UsuarioRepositorio usuarioRepositorio;

    public LogActividadServicio(
            LogActividadRepositorio logActividadRepositorio,
            UsuarioRepositorio usuarioRepositorio
    ) {
        this.logActividadRepositorio = logActividadRepositorio;
        this.usuarioRepositorio = usuarioRepositorio;
    }

    public Long registrar(
            Long idUsuario,
            String tipoAccion,
            String descripcion,
            String ipOrigen,
            boolean exitosa
    ) {

        if (
                tipoAccion == null
                || tipoAccion.isBlank()
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El tipo de acción es obligatorio"
            );
        }

        if (
                descripcion == null
                || descripcion.isBlank()
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La descripción es obligatoria"
            );
        }

        if (
                idUsuario != null
                && !usuarioRepositorio.existsById(idUsuario)
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El usuario responsable no existe"
            );
        }

        return logActividadRepositorio.insertar(
                idUsuario,
                tipoAccion.trim(),
                descripcion.trim(),
                ipOrigen,
                OffsetDateTime.now(),
                exitosa
        );
    }

    public ConsultaLogsRespuesta consultar(
            String busqueda,
            String tipoAccion,
            LocalDate fechaDesde,
            LocalDate fechaHasta,
            Long idUsuario,
            Boolean exitosa,
            int pagina,
            int tamanio
    ) {

        int paginaSegura = Math.max(pagina, 0);

        int tamanioSeguro = Math.min(
                Math.max(tamanio, 1),
                TAMANIO_MAXIMO
        );

        String busquedaNormalizada =
                normalizarTexto(busqueda);

        List<LogActividadRespuesta> logs =
                logActividadRepositorio.consultar(
                        busquedaNormalizada,
                        normalizarTexto(tipoAccion),
                        fechaDesde,
                        fechaHasta,
                        idUsuario,
                        exitosa,
                        paginaSegura,
                        tamanioSeguro
                );

        long total = logActividadRepositorio.contar(
                busquedaNormalizada,
                normalizarTexto(tipoAccion),
                fechaDesde,
                fechaHasta,
                idUsuario,
                exitosa
        );

        int totalPaginas = total == 0
                ? 0
                : (int) Math.ceil(
                        (double) total / tamanioSeguro
                );

        return new ConsultaLogsRespuesta(
                logs,
                total,
                paginaSegura,
                tamanioSeguro,
                totalPaginas
        );
    }

    public LogActividadRespuesta buscarPorId(
            Long idLog
    ) {

        return logActividadRepositorio
                .buscarPorId(idLog)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Registro de auditoría no encontrado"
                        )
                );
    }

    public List<String> listarTipos() {
        return logActividadRepositorio.listarTipos();
    }

    private String normalizarTexto(String valor) {

        return valor == null || valor.isBlank()
                ? null
                : valor.trim();
    }
}