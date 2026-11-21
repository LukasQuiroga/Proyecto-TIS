package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.response.ReporteAccesosIncorrectosRespuesta;
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
public class ReporteAccesosIncorrectosPdfServicio {

    private static final ZoneId ZONA_BOLIVIA =
            ZoneId.of("America/La_Paz");

    private static final DateTimeFormatter FORMATO_FECHA_HORA =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    private final ReporteAccesosIncorrectosServicio reportes;

    public ReporteAccesosIncorrectosPdfServicio(
            ReporteAccesosIncorrectosServicio reportes) {
        this.reportes = reportes;
    }

    @Transactional(readOnly = true)
    public byte[] generarPdf(Long idReporte) {

        ReporteAccesosIncorrectosRespuesta reporte =
                reportes.obtener(idReporte);

        try (PDDocument documento = new PDDocument()) {

            ReportePdfUtil pdf =
                    new ReportePdfUtil(documento, true);

            pdf.titulo("REPORTE DE ACCESOS INCORRECTOS");

            pdf.dato(
                    "Identificador",
                    "RPT-" + reporte.idReporte()
            );

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

            pdf.indicadores(
                    new String[]{
                            "ACCESOS INCORRECTOS",
                            "INGRESOS AUTORIZADOS",
                            "TOTAL PADRON"
                    },
                    new int[]{
                            reporte.totalRechazados(),
                            reporte.totalIngresosAutorizados(),
                            reporte.totalPadron()
                    }
            );

            pdf.seccion("Lista de intentos rechazados");

            String[] encabezados = {
                    "N.º",
                    "Código SIS",
                    "Estudiante",
                    "Carrera",
                    "Identificador",
                    "Método",
                    "Fecha y hora",
                    "Motivo de rechazo",
                    "Estado"
            };

            float[] anchos = {
                    30,
                    72,
                    106,
                    78,
                    94,
                    65,
                    105,
                    141,
                    70
            };

            List<String[]> filas = new ArrayList<>();
            int numero = 1;

            for (var intento : reporte.intentos()) {

                filas.add(new String[]{
                        String.valueOf(numero++),
                        valor(intento.codigoEstudiante()),
                        valor(intento.nombreCompleto()),
                        valor(intento.carrera()),
                        valor(intento.identificadorIntentado()),
                        valor(intento.metodoIdentificacion()),
                        formatear(intento.fechaHora()),
                        valor(intento.motivoRechazo()),
                        "Rechazado"
                });
            }

            pdf.tabla(encabezados, anchos, filas);

            return pdf.finalizar();

        } catch (IOException e) {
            throw new IllegalStateException(
                    "No se pudo generar el PDF de accesos incorrectos",
                    e
            );
        }
    }

    private static String valor(String texto) {
        return texto == null || texto.isBlank()
                ? "-"
                : texto;
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
