package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.response.ReporteHorariosDetalleRespuesta;
import com.lacomarcasoft.dto.response.ReporteHorariosRespuesta;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class ReporteHorariosPdfServicio {

    private static final ZoneId ZONA_BOLIVIA =
            ZoneId.of("America/La_Paz");

    private static final DateTimeFormatter FORMATO_FECHA_HORA =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    private final ReporteHorariosServicio reportes;

    public ReporteHorariosPdfServicio(
            ReporteHorariosServicio reportes) {
        this.reportes = reportes;
    }

    @Transactional(readOnly = true)
    public byte[] generarPdf(Long idReporte) {

        ReporteHorariosRespuesta reporte =
                reportes.obtener(idReporte);

        try (PDDocument documento = new PDDocument()) {

            ReportePdfUtil pdf =
                    new ReportePdfUtil(documento, false);

            pdf.titulo("REPORTE DE HORARIOS DE INGRESO");

            pdf.dato("Identificador",
                    "RPT-" + reporte.idReporte());

            pdf.dato("Examen", reporte.nombreExamen());
            pdf.dato("Asignatura", reporte.asignatura());

            pdf.dato(
                    "Fecha del examen",
                    reporte.fechaExamen() == null
                            ? "Sin fecha"
                            : reporte.fechaExamen().format(
                                    DateTimeFormatter.ofPattern(
                                            "dd/MM/yyyy"))
            );

            pdf.dato(
                    "Hora de inicio",
                    reporte.horaInicio() == null
                            ? "Sin hora"
                            : reporte.horaInicio().format(
                                    DateTimeFormatter.ofPattern(
                                            "HH:mm"))
            );

            pdf.dato(
                    "Generado por",
                    reporte.nombreGenerador()
            );

            pdf.dato(
                    "Fecha de generación",
                    formatear(reporte.fechaGeneracion())
            );

            pdf.indicador(
                    "TOTAL DE INGRESOS REGISTRADOS",
                    reporte.totalIngresos()
            );

            pdf.seccion("Estudiantes ingresados");

            String[] encabezados = {
                    "N.º",
                    "Código SIS",
                    "Nombre completo",
                    "Fecha y hora de ingreso"
            };

            float[] anchos = {
                    38,
                    95,
                    190,
                    192
            };

            List<String[]> filas = new ArrayList<>();
            int numero = 1;

            for (ReporteHorariosDetalleRespuesta estudiante
                    : reporte.estudiantes()) {

                filas.add(new String[]{
                        String.valueOf(numero++),
                        estudiante.codigoEstudiante(),
                        estudiante.nombreCompleto(),
                        formatear(estudiante.fechaHoraIngreso())
                });
            }

            pdf.tabla(encabezados, anchos, filas);

            return pdf.finalizar();

        } catch (IOException e) {
            throw new IllegalStateException(
                    "No se pudo generar el PDF de horarios de ingreso",
                    e
            );
        }
    }

    private static String formatear(
            OffsetDateTime fecha) {

        if (fecha == null) {
            return "-";
        }

        return fecha
                .atZoneSameInstant(ZONA_BOLIVIA)
                .format(FORMATO_FECHA_HORA);
    }
}
