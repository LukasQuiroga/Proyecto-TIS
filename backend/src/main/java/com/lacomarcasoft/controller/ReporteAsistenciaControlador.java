package com.lacomarcasoft.controller;

import com.lacomarcasoft.dto.response.ReporteAsistenciaExamenRespuesta;
import com.lacomarcasoft.dto.response.ReporteAsistenciaHistorialRespuesta;
import com.lacomarcasoft.dto.response.ReporteAsistenciaRespuesta;
import com.lacomarcasoft.dto.response.ReporteAusentesRespuesta;
import com.lacomarcasoft.service.ReporteAsistenciaServicio;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reportes/asistencia")
public class ReporteAsistenciaControlador {

    private final ReporteAsistenciaServicio servicio;

    public ReporteAsistenciaControlador(ReporteAsistenciaServicio servicio) {
        this.servicio = servicio;
    }

    @GetMapping("/examenes")
    public List<ReporteAsistenciaExamenRespuesta> listarExamenes(
            @RequestParam(required = false) String buscar,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return servicio.listarExamenes(buscar, fecha);
    }

    @GetMapping("/ausentes/examenes/{idExamen}")
    public ReporteAusentesRespuesta consultarAusentes(@PathVariable Long idExamen) {
        return servicio.consultarAusentes(idExamen);
    }

    @PostMapping("/examenes/{idExamen}")
    public ReporteAsistenciaRespuesta generar(
            @PathVariable Long idExamen,
            Authentication authentication,
            HttpServletRequest request) {
        Long idGenerador = authentication != null && authentication.getDetails() instanceof Long id
                ? id : null;
        return servicio.generar(idExamen, idGenerador, obtenerIp(request));
    }

    @GetMapping("/historial")
    public List<ReporteAsistenciaHistorialRespuesta> historial(
            @RequestParam(required = false) String buscar) {
        return servicio.historial(buscar);
    }

    @GetMapping("/{idReporte}")
    public ReporteAsistenciaRespuesta obtener(@PathVariable Long idReporte) {
        return servicio.obtener(idReporte);
    }

    @GetMapping(value = "/{idReporte}/descarga", produces = "text/csv")
    public ResponseEntity<byte[]> descargar(@PathVariable Long idReporte) {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"reporte-asistencia-" + idReporte + ".csv\"")
                .body(servicio.descargarCsv(idReporte));
    }

    private String obtenerIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip != null && !ip.isBlank()) {
            return ip.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
