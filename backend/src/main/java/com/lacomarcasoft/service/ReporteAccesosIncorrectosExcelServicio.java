package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.response.ReporteAccesosIncorrectosDetalleRespuesta;
import com.lacomarcasoft.dto.response.ReporteAccesosIncorrectosRespuesta;
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
public class ReporteAccesosIncorrectosExcelServicio {

    private static final ZoneId ZONA_BOLIVIA =
            ZoneId.of("America/La_Paz");

    private static final DateTimeFormatter FORMATO_FECHA =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    private final ReporteAccesosIncorrectosServicio reportes;

    public ReporteAccesosIncorrectosExcelServicio(
            ReporteAccesosIncorrectosServicio reportes) {
        this.reportes = reportes;
    }

    @Transactional(readOnly = true)
    public byte[] generarExcel(Long idReporte) {

        ReporteAccesosIncorrectosRespuesta reporte =
                reportes.obtener(idReporte);

        try (XSSFWorkbook libro = new XSSFWorkbook();
             ByteArrayOutputStream salida =
                     new ByteArrayOutputStream()) {

            Sheet hoja = libro.createSheet("Accesos incorrectos");

            CellStyle titulo = crearEstilo(
                    libro, IndexedColors.DARK_BLUE, true, true);

            CellStyle encabezado = crearEstilo(
                    libro, IndexedColors.DARK_BLUE, true, true);

            CellStyle etiqueta = crearEstilo(
                    libro, IndexedColors.GREY_25_PERCENT, true, false);

            CellStyle normal = crearEstilo(
                    libro, IndexedColors.WHITE, false, false);

            CellStyle rechazado = crearEstilo(
                    libro, IndexedColors.ROSE, true, false);

            Row filaTitulo = hoja.createRow(0);
            filaTitulo.setHeightInPoints(32);

            celdaTexto(
                    filaTitulo, 0,
                    "REPORTE DE ACCESOS INCORRECTOS", titulo);

            hoja.addMergedRegion(
                    new CellRangeAddress(0, 0, 0, 8));

            // Información del examen
            dato(hoja, 2, "Examen",
                    reporte.nombreExamen(), etiqueta, normal);

            dato(hoja, 3, "Asignatura",
                    reporte.asignatura(), etiqueta, normal);

            dato(hoja, 4, "Fecha del examen",
                    reporte.fechaExamen() == null
                            ? "Sin fecha"
                            : reporte.fechaExamen().toString(),
                    etiqueta, normal);

            dato(hoja, 5, "Hora del examen",
                    reporte.horaInicio() == null
                            ? "Sin hora"
                            : reporte.horaInicio().toString(),
                    etiqueta, normal);

            dato(hoja, 6, "Generado por",
                    reporte.nombreGenerador(), etiqueta, normal);

            dato(hoja, 7, "Fecha de generación",
                    formatear(reporte.fechaGeneracion()),
                    etiqueta, normal);

            Row filaIndicadores = hoja.createRow(9);
            filaIndicadores.setHeightInPoints(28);

            celdaTexto(filaIndicadores, 0,
                    "ACCESOS INCORRECTOS", encabezado);
            hoja.addMergedRegion(
                    new CellRangeAddress(9, 9, 0, 2)
            );

            celdaTexto(filaIndicadores, 3,
                    "INGRESOS AUTORIZADOS", encabezado);
            hoja.addMergedRegion(
                    new CellRangeAddress(9, 9, 3, 5)
            );

            celdaTexto(filaIndicadores, 6,
                    "TOTAL PADRÓN", encabezado);
            hoja.addMergedRegion(
                    new CellRangeAddress(9, 9, 6, 8)
            );

            Row filaValores = hoja.createRow(10);
            filaValores.setHeightInPoints(30);

            celdaNumero(filaValores, 0,
                    reporte.totalRechazados(), normal);
            hoja.addMergedRegion(
                    new CellRangeAddress(10, 10, 0, 2)
            );

            celdaNumero(filaValores, 3,
                    reporte.totalIngresosAutorizados(), normal);
            hoja.addMergedRegion(
                    new CellRangeAddress(10, 10, 3, 5)
            );

            celdaNumero(filaValores, 6,
                    reporte.totalPadron(), normal);
            hoja.addMergedRegion(
                    new CellRangeAddress(10, 10, 6, 8)
            );

            int filaEncabezados = 13;

            Row encabezados = hoja.createRow(filaEncabezados);
            encabezados.setHeightInPoints(28);

            String[] columnas = {
                    "#",
                    "Código SIS",
                    "Nombre completo",
                    "Carrera",
                    "Identificador intentado",
                    "Método",
                    "Fecha y hora",
                    "Motivo del rechazo",
                    "Estado"
            };

            for (int columna = 0;
                 columna < columnas.length; columna++) {

                celdaTexto(encabezados, columna,
                        columnas[columna], encabezado);
            }

            int numeroFila = filaEncabezados + 1;
            int contador = 1;

            for (ReporteAccesosIncorrectosDetalleRespuesta intento
                    : reporte.intentos()) {

                Row fila = hoja.createRow(numeroFila++);

                celdaNumero(fila, 0, contador++, normal);

                celdaTexto(fila, 1,
                        intento.codigoEstudiante(), normal);

                celdaTexto(fila, 2,
                        intento.nombreCompleto() == null ||
                        intento.nombreCompleto().isBlank()
                                ? "No identificado"
                                : intento.nombreCompleto(),
                        normal);

                celdaTexto(fila, 3,
                        intento.carrera(), normal);

                celdaTexto(fila, 4,
                        intento.identificadorIntentado(), normal);

                celdaTexto(fila, 5,
                        intento.metodoIdentificacion(), normal);

                celdaTexto(fila, 6,
                        formatear(intento.fechaHora()), normal);

                celdaTexto(fila, 7,
                        intento.motivoRechazo(), normal);

                celdaTexto(fila, 8,
                        "Rechazado", rechazado);
            }

            if (reporte.intentos().isEmpty()) {
                Row fila = hoja.createRow(numeroFila++);
                celdaTexto(fila, 0,
                        "No hay accesos rechazados registrados",
                        normal);

                hoja.addMergedRegion(new CellRangeAddress(
                        fila.getRowNum(),
                        fila.getRowNum(),
                        0, 8
                ));
            }

            // Filtros de la tabla
            if (!reporte.intentos().isEmpty()) {
                hoja.setAutoFilter(new CellRangeAddress(
                        filaEncabezados,
                        numeroFila - 1,
                        0, 8
                ));
            }

            hoja.createFreezePane(0, filaEncabezados + 1);

            // Anchos de columna
            int[] anchos = {
                    8, 18, 30, 28, 25, 18, 24, 40, 16
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
                    "No se pudo generar el archivo Excel", e);
        }
    }

    private static CellStyle crearEstilo(
            Workbook libro,
            IndexedColors fondo,
            boolean negrita,
            boolean textoBlanco) {

        CellStyle estilo = libro.createCellStyle();

        estilo.setFillForegroundColor(fondo.getIndex());
        estilo.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        estilo.setVerticalAlignment(VerticalAlignment.CENTER);
        estilo.setAlignment(HorizontalAlignment.LEFT);
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

        // Se almacena como texto, nunca como fórmula
        celda.setCellValue(valor == null ? "" : valor);
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
                new CellRangeAddress(numeroFila, numeroFila, 0, 1)
        );

        celdaTexto(fila, 2, valor, normal);
        hoja.addMergedRegion(
                new CellRangeAddress(numeroFila, numeroFila, 2, 5)
        );
    }

    private static String formatear(
            OffsetDateTime fecha) {

        if (fecha == null) {
            return "—";
        }

        return fecha
                .atZoneSameInstant(ZONA_BOLIVIA)
                .format(FORMATO_FECHA);
    }
}
