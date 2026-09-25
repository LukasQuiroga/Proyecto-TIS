package com.lacomarcasoft.controller;

import com.lacomarcasoft.dto.request.RegistrarLogSolicitud;
import com.lacomarcasoft.dto.response.ConsultaLogsRespuesta;
import com.lacomarcasoft.dto.response.LogActividadRespuesta;
import com.lacomarcasoft.service.LogActividadServicio;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/logs")
public class LogActividadControlador {

    private final LogActividadServicio logActividadServicio;

    public LogActividadControlador(
            LogActividadServicio logActividadServicio
    ) {
        this.logActividadServicio = logActividadServicio;
    }

    @GetMapping
    public ConsultaLogsRespuesta consultar(
            @RequestParam(required = false) String busqueda,
            @RequestParam(required = false) String tipoAccion,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fechaDesde,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fechaHasta,
            @RequestParam(required = false) Long idUsuario,
            @RequestParam(required = false) Boolean exitosa,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "10") int tamanio
    ) {
        return logActividadServicio.consultar(
                busqueda,
                tipoAccion,
                fechaDesde,
                fechaHasta,
                idUsuario,
                exitosa,
                pagina,
                tamanio
        );
    }

    @GetMapping("/tipos")
    public List<String> listarTipos() {
        return logActividadServicio.listarTipos();
    }

    @GetMapping("/{idLog}")
    public LogActividadRespuesta buscarPorId(
            @PathVariable Long idLog
    ) {
        return logActividadServicio.buscarPorId(idLog);
    }

    @PostMapping
    public ResponseEntity<LogActividadRespuesta> registrar(
            @RequestHeader(
                    value = "X-Usuario-Id",
                    required = false
            )
            Long idUsuarioHeader,
            @Valid
            @RequestBody
            RegistrarLogSolicitud solicitud,
            HttpServletRequest request
    ) {

        Long idUsuario = solicitud.idUsuario() != null
                ? solicitud.idUsuario()
                : idUsuarioHeader;

        boolean exitosa = solicitud.exitosa() == null
                ? true
                : solicitud.exitosa();

        Long idLog = logActividadServicio.registrar(
                idUsuario,
                solicitud.tipoAccion(),
                solicitud.descripcion(),
                obtenerIp(request),
                exitosa
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(logActividadServicio.buscarPorId(idLog));
    }

    private String obtenerIp(
            HttpServletRequest request
    ) {
        String ip = request.getHeader("X-Forwarded-For");

        if (
                ip != null
                && !ip.isBlank()
        ) {
            return ip.split(",")[0].trim();
        }

        return request.getRemoteAddr();
    }
}