package com.lacomarcasoft.controller;

import com.lacomarcasoft.dto.response.ReporteAccesosIncorrectosHistorialRespuesta;
import com.lacomarcasoft.dto.response.ReporteAccesosIncorrectosRespuesta;
import com.lacomarcasoft.service.ReporteAccesosIncorrectosServicio;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.lacomarcasoft.service.ReporteAccesosIncorrectosExcelServicio;
import com.lacomarcasoft.service.ReporteAccesosIncorrectosPdfServicio;
import java.util.List;

@RestController
@RequestMapping("/api/reportes/accesos-incorrectos")
public class ReporteAccesosIncorrectosControlador {

    private final ReporteAccesosIncorrectosServicio servicio;
    private final ReporteAccesosIncorrectosExcelServicio excelServicio;
    private final ReporteAccesosIncorrectosPdfServicio pdfServicio;    
    public ReporteAccesosIncorrectosControlador(
            ReporteAccesosIncorrectosServicio servicio,
            ReporteAccesosIncorrectosExcelServicio excelServicio,
            ReporteAccesosIncorrectosPdfServicio pdfServicio) {
        this.servicio = servicio;
        this.excelServicio = excelServicio;
        this.pdfServicio = pdfServicio;
    }

    @PostMapping("/examenes/{idExamen}")
    public ReporteAccesosIncorrectosRespuesta generar(
            @PathVariable Long idExamen,
            Authentication authentication,
            HttpServletRequest request) {

        Long idGenerador = authentication != null &&
                authentication.getDetails() instanceof Long id
                        ? id
                        : null;

        return servicio.generar(
                idExamen,
                idGenerador,
                obtenerIp(request));
    }

    @GetMapping("/historial")
    public List<ReporteAccesosIncorrectosHistorialRespuesta> historial(
            @RequestParam(required = false) String buscar) {

        return servicio.historial(buscar);
    }

    @GetMapping("/{idReporte}")
    public ReporteAccesosIncorrectosRespuesta obtener(
            @PathVariable Long idReporte) {

        return servicio.obtener(idReporte);
    }

    @GetMapping(value = "/{idReporte}/descarga", produces = "text/csv")
    public ResponseEntity<byte[]> descargar(
            @PathVariable Long idReporte) {

        return ResponseEntity.ok()
                .contentType(
                        MediaType.parseMediaType(
                                "text/csv;charset=UTF-8"))
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"reporte-accesos-incorrectos-"
                                + idReporte + ".csv\"")
                .body(servicio.descargarCsv(idReporte));
    }

    @GetMapping(
            value = "/{idReporte}/excel",
            produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    public ResponseEntity<byte[]> descargarExcel(
            @PathVariable Long idReporte) {

        byte[] archivo = excelServicio.generarExcel(idReporte);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                ))
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"reporte-accesos-incorrectos-"
                                + idReporte + ".xlsx\""
                )
                .contentLength(archivo.length)
                .body(archivo);
    }

        @GetMapping(
                value = "/{idReporte}/pdf",
                produces = MediaType.APPLICATION_PDF_VALUE
        )
        public ResponseEntity<byte[]> descargarPdf(
                @PathVariable Long idReporte) {

        byte[] archivo = pdfServicio.generarPdf(idReporte);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"reporte-accesos-incorrectos-"
                                + idReporte + ".pdf\""
                )
                .contentLength(archivo.length)
                .body(archivo);
        }

    private String obtenerIp(HttpServletRequest request) {

        String ip = request.getHeader("X-Forwarded-For");

        if (ip != null && !ip.isBlank()) {
            return ip.split(",")[0].trim();
        }

        return request.getRemoteAddr();
    }
}
