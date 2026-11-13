package com.lacomarcasoft.controller;

import com.lacomarcasoft.dto.response.ReporteHorariosHistorialRespuesta;
import com.lacomarcasoft.dto.response.ReporteHorariosRespuesta;
import com.lacomarcasoft.service.ReporteHorariosServicio;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reportes/horarios")
public class ReporteHorariosControlador {

    private final ReporteHorariosServicio servicio;

    public ReporteHorariosControlador(ReporteHorariosServicio servicio) {
        this.servicio = servicio;
    }

    @PostMapping("/examenes/{idExamen}")
    public ReporteHorariosRespuesta generar(
            @PathVariable Long idExamen,
            Authentication authentication,
            HttpServletRequest request) {

        Long idGenerador =
                authentication != null &&
                authentication.getDetails() instanceof Long id
                        ? id : null;

        return servicio.generar(
                idExamen,
                idGenerador,
                obtenerIp(request)
        );
    }

    @GetMapping("/historial")
    public List<ReporteHorariosHistorialRespuesta> historial(
            @RequestParam(required = false) String buscar) {

        return servicio.historial(buscar);
    }

    @GetMapping("/{idReporte}")
    public ReporteHorariosRespuesta obtener(
            @PathVariable Long idReporte) {

        return servicio.obtener(idReporte);
    }

    @GetMapping(
            value = "/{idReporte}/descarga",
            produces = "text/csv"
    )
    public ResponseEntity<byte[]> descargar(
            @PathVariable Long idReporte) {

        return ResponseEntity.ok()
                .contentType(
                        MediaType.parseMediaType(
                                "text/csv;charset=UTF-8"
                        )
                )
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"reporte-horarios-"
                                + idReporte + ".csv\""
                )
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
