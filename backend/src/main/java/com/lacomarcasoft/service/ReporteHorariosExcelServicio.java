
package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.response.ReporteHorariosDetalleRespuesta;
import com.lacomarcasoft.dto.response.ReporteHorariosRespuesta;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Service
public class ReporteHorariosExcelServicio {

    private static final ZoneId ZONA_BOLIVIA =
            ZoneId.of("America/La_Paz");

    private static final DateTimeFormatter FORMATO_FECHA_HORA =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    private final ReporteHorariosServicio reportes;

    public ReporteHorariosExcelServicio(
            ReporteHorariosServicio reportes) {
        this.reportes = reportes;
    }

    @Transactional(readOnly = true)
    public byte[] generarExcel(Long idReporte) {

        ReporteHorariosRespuesta reporte =
                reportes.obtener(idReporte);

        try (XSSFWorkbook libro = new XSSFWorkbook();
             ByteArrayOutputStream salida =
                     new ByteArrayOutputStream()) {

            Sheet hoja = libro.createSheet("Horarios de ingreso");

            CellStyle titulo = crearEstilo(
                    libro, IndexedColors.DARK_BLUE, true, true);

            CellStyle encabezado = crearEstilo(
                    libro, IndexedColors.DARK_BLUE, true, true);

            CellStyle etiqueta = crearEstilo(
                    libro, IndexedColors.GREY_25_PERCENT,
                    true, false);

            CellStyle normal = crearEstilo(
                    libro, IndexedColors.WHITE, false, false);

            Row filaTitulo = hoja.createRow(0);
            filaTitulo.setHeightInPoints(32);

            celdaTexto(
                    filaTitulo,
                    0,
                    "REPORTE DE HORARIOS DE INGRESO",
                    titulo
            );

            hoja.addMergedRegion(
                    new CellRangeAddress(0, 0, 0, 5)
            );

            dato(hoja, 2, "Examen",
                    reporte.nombreExamen(), etiqueta, normal);

            dato(hoja, 3, "Asignatura",
                    reporte.asignatura(), etiqueta, normal);

            dato(hoja, 4, "Fecha del examen",
                    reporte.fechaExamen() == null
                            ? "Sin fecha"
                            : reporte.fechaExamen()
                                    .format(DateTimeFormatter
                                            .ofPattern("dd/MM/yyyy")),
                    etiqueta, normal);

            dato(hoja, 5, "Hora de inicio",
                    reporte.horaInicio() == null
                            ? "Sin hora"
                            : reporte.horaInicio()
                                    .format(DateTimeFormatter
                                            .ofPattern("HH:mm")),
                    etiqueta, normal);

            dato(hoja, 6, "Generado por",
                    reporte.nombreGenerador(), etiqueta, normal);

            dato(hoja, 7, "Fecha de generacion",
                    formatear(reporte.fechaGeneracion()),
                    etiqueta, normal);

            Row indicador = hoja.createRow(9);
            indicador.setHeightInPoints(28);

            celdaTexto(indicador, 0,
                    "TOTAL DE INGRESOS REGISTRADOS",
                    encabezado);

            hoja.addMergedRegion(
                    new CellRangeAddress(9, 9, 0, 5)
            );

            Row valorIndicador = hoja.createRow(10);
            valorIndicador.setHeightInPoints(28);

            celdaNumero(valorIndicador, 0,
                    reporte.totalIngresos(), normal);

            hoja.addMergedRegion(
                    new CellRangeAddress(10, 10, 0, 5)
            );

            int filaEncabezados = 13;

            Row encabezados = hoja.createRow(filaEncabezados);
            encabezados.setHeightInPoints(28);

            String[] columnas = {
                    "#",
                    "Codigo SIS",
                    "Nombre completo",
                    "Fecha y hora de ingreso"
            };

            for (int columna = 0;
                 columna < columnas.length; columna++) {

                celdaTexto(
                        encabezados,
                        columna,
                        columnas[columna],
                        encabezado
                );
            }

            int numeroFila = filaEncabezados + 1;
            int contador = 1;

            for (ReporteHorariosDetalleRespuesta estudiante
                    : reporte.estudiantes()) {

                Row fila = hoja.createRow(numeroFila++);

                celdaNumero(fila, 0, contador++, normal);

                celdaTexto(
                        fila, 1,
                        estudiante.codigoEstudiante(),
                        normal
                );

                celdaTexto(
                        fila, 2,
                        estudiante.nombreCompleto(),
                        normal
                );

                celdaTexto(
                        fila, 3,
                        formatear(estudiante.fechaHoraIngreso()),
                        normal
                );
            }

            // Examen sin ingresos registrados
            if (reporte.estudiantes().isEmpty()) {

                Row fila = hoja.createRow(numeroFila);

                celdaTexto(
                        fila,
                        0,
                        "No hay ingresos registrados",
                        normal
                );

                hoja.addMergedRegion(
                        new CellRangeAddress(
                                numeroFila,
                                numeroFila,
                                0,
                                3
                        )
                );

            } else {

                hoja.setAutoFilter(
                        new CellRangeAddress(
                                filaEncabezados,
                                numeroFila - 1,
                                0,
                                3
                        )
                );
            }

            hoja.createFreezePane(
                    0,
                    filaEncabezados + 1
            );

            int[] anchos = {
                    10, 22, 38, 28, 20, 20
            };

            for (int i = 0; i < anchos.length; i++) {
                hoja.setColumnWidth(i, anchos[i] * 256);
            }

            hoja.setPrintGridlines(false);
            hoja.setFitToPage(true);

            libro.write(salida);

            return salida.toByteArray();

        } catch (IOException e) {
            throw new IllegalStateException(
                    "No se pudo generar el Excel de horarios",
                    e
            );
        }
    }

    private static CellStyle crearEstilo(
            Workbook libro,
            IndexedColors fondo,
            boolean negrita,
            boolean textoBlanco) {

        CellStyle estilo = libro.createCellStyle();

        estilo.setFillForegroundColor(fondo.getIndex());
        estilo.setFillPattern(
                FillPatternType.SOLID_FOREGROUND
        );

        estilo.setVerticalAlignment(
                VerticalAlignment.CENTER
        );

        estilo.setAlignment(
                HorizontalAlignment.LEFT
        );

        estilo.setWrapText(true);

        Font fuente = libro.createFont();
        fuente.setBold(negrita);

        fuente.setColor(
                textoBlanco
                        ? IndexedColors.WHITE.getIndex()
                        : IndexedColors.BLACK.getIndex()
        );

        estilo.setFont(fuente);

        return estilo;
    }

    private static void celdaTexto(
            Row fila,
            int columna,
            String valor,
            CellStyle estilo) {

        Cell celda = fila.createCell(columna);

        celda.setCellValue(
                valor == null ? "" : valor
        );

        celda.setCellStyle(estilo);
    }

    private static void celdaNumero(
            Row fila,
            int columna,
            int valor,
            CellStyle estilo) {

        Cell celda = fila.createCell(columna);
        celda.setCellValue(valor);
        celda.setCellStyle(estilo);
    }

    private static void dato(
            Sheet hoja,
            int numeroFila,
            String nombre,
            String valor,
            CellStyle etiqueta,
            CellStyle normal) {

        Row fila = hoja.createRow(numeroFila);
        fila.setHeightInPoints(25);

        celdaTexto(fila, 0, nombre, etiqueta);

        hoja.addMergedRegion(
                new CellRangeAddress(
                        numeroFila, numeroFila, 0, 1
                )
        );

        celdaTexto(fila, 2, valor, normal);

        hoja.addMergedRegion(
                new CellRangeAddress(
                        numeroFila, numeroFila, 2, 5
                )
        );
    }

    private static String formatear(
            OffsetDateTime fecha) {

        if (fecha == null) {
            return "—";
        }

        return fecha.atZoneSameInstant(ZONA_BOLIVIA)
                .format(FORMATO_FECHA_HORA);
    }
}
