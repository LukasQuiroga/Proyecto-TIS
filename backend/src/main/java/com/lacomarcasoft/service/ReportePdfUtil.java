package com.lacomarcasoft.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class ReportePdfUtil {

    private static final float MARGEN = 40;
    private static final float ALTO_LINEA = 12;

    private static final Color AZUL =
            new Color(11, 18, 111);
    private static final Color GRIS =
            new Color(242, 244, 248);
    private static final Color TEXTO =
            new Color(35, 42, 54);

    private final PDDocument documento;
    private final PDFont normal;
    private final PDFont negrita;
    private final PDRectangle formato;

    private PDPageContentStream contenido;
    private float y;
    private int numeroPagina;

    public ReportePdfUtil(
            PDDocument documento,
            boolean horizontal) throws IOException {

        this.documento = documento;
        this.formato = horizontal
                ? new PDRectangle(
                        PDRectangle.A4.getHeight(),
                        PDRectangle.A4.getWidth())
                : PDRectangle.A4;

        normal = new PDType1Font(
                Standard14Fonts.FontName.HELVETICA);

        negrita = new PDType1Font(
                Standard14Fonts.FontName.HELVETICA_BOLD);

        nuevaPagina();
    }

    private void nuevaPagina() throws IOException {
        if (contenido != null) {
            piePagina();
            contenido.close();
        }

        PDPage pagina = new PDPage(formato);
        documento.addPage(pagina);

        contenido = new PDPageContentStream(
                documento, pagina);

        numeroPagina++;
        y = formato.getHeight() - MARGEN;
    }

    private void piePagina() throws IOException {
        texto(
                "ExamPass - Página " + numeroPagina,
                MARGEN,
                24,
                normal,
                8,
                Color.GRAY
        );
    }

    private String seguro(String valor, PDFont fuente) {
        String original = valor == null ? "" : valor;
        StringBuilder resultado = new StringBuilder();

        for (int offset = 0;
             offset < original.length();) {

            int codigo = original.codePointAt(offset);
            offset += Character.charCount(codigo);

            String caracter = new String(
                    Character.toChars(codigo));

            if (Character.isISOControl(codigo)) {
                resultado.append(' ');
                continue;
            }

            try {
                fuente.encode(caracter);
                resultado.append(caracter);
            } catch (IOException | IllegalArgumentException ex) {
                resultado.append('-');
            }
        }

        return resultado.toString();
    }

    private void texto(
            String valor,
            float x,
            float posicionY,
            PDFont fuente,
            float tamano,
            Color color) throws IOException {

        contenido.beginText();
        contenido.setFont(fuente, tamano);
        contenido.setNonStrokingColor(color);
        contenido.newLineAtOffset(x, posicionY);
        contenido.showText(seguro(valor, fuente));
        contenido.endText();
    }

    private float anchoTexto(
            String valor,
            PDFont fuente,
            float tamano) throws IOException {

        return fuente.getStringWidth(
                seguro(valor, fuente)) / 1000 * tamano;
    }

    private void rectangulo(
            float x,
            float posicionY,
            float ancho,
            float alto,
            Color color) throws IOException {

        contenido.setNonStrokingColor(color);
        contenido.addRect(x, posicionY, ancho, alto);
        contenido.fill();
    }

    private void espacio(float alto) throws IOException {
        if (y - alto < 55) {
            nuevaPagina();
        }
    }

    public void titulo(String titulo) throws IOException {
        espacio(58);

        rectangulo(
                MARGEN,
                y - 42,
                formato.getWidth() - MARGEN * 2,
                42,
                AZUL
        );

        texto(
                titulo,
                MARGEN + 12,
                y - 26,
                negrita,
                15,
                Color.WHITE
        );

        y -= 62;
    }

    public void dato(
            String etiqueta,
            String valor) throws IOException {

        espacio(23);

        texto(etiqueta + ":", MARGEN, y,
                negrita, 10, TEXTO);

        List<String> lineas = dividir(
                valor,
                normal,
                10,
                formato.getWidth() - 235
        );

        float alto = Math.max(23, lineas.size() * 13 + 8);
        espacio(alto);

        for (String linea : lineas) {
            texto(linea, MARGEN + 155, y,
                    normal, 10, TEXTO);
            y -= 13;
        }

        y -= Math.max(0, alto - lineas.size() * 13);
    }

    public void indicador(
            String etiqueta,
            int valor) throws IOException {

        espacio(65);

        rectangulo(
                MARGEN,
                y - 49,
                formato.getWidth() - MARGEN * 2,
                49,
                GRIS
        );

        texto(etiqueta, MARGEN + 12, y - 16,
                negrita, 10, AZUL);

        texto(String.valueOf(valor),
                MARGEN + 12, y - 36,
                negrita, 17, TEXTO);

        y -= 67;
    }

    public void indicadores(
            String[] etiquetas,
            int[] valores) throws IOException {

        if (etiquetas.length != valores.length ||
                etiquetas.length == 0) {
            throw new IllegalArgumentException(
                    "Los indicadores no coinciden");
        }

        espacio(65);

        float anchoDisponible =
                formato.getWidth() - MARGEN * 2;

        float separacion = 8;
        float anchoTarjeta =
                (anchoDisponible -
                        (etiquetas.length - 1) * separacion)
                        / etiquetas.length;

        for (int i = 0; i < etiquetas.length; i++) {
            float x = MARGEN +
                    i * (anchoTarjeta + separacion);

            rectangulo(
                    x,
                    y - 49,
                    anchoTarjeta,
                    49,
                    GRIS
            );

            texto(
                    etiquetas[i],
                    x + 10,
                    y - 16,
                    negrita,
                    8,
                    AZUL
            );

            texto(
                    String.valueOf(valores[i]),
                    x + 10,
                    y - 36,
                    negrita,
                    17,
                    TEXTO
            );
        }

        y -= 67;
    }

    public void seccion(String titulo) throws IOException {
        espacio(34);

        texto(titulo, MARGEN, y,
                negrita, 12, AZUL);

        y -= 23;
    }

    private List<String> dividir(
            String valor,
            PDFont fuente,
            float tamano,
            float anchoMaximo) throws IOException {

        String limpio = seguro(valor, fuente)
                .replace('\n', ' ')
                .replace('\r', ' ')
                .trim();

        if (limpio.isEmpty()) {
            return List.of("-");
        }

        List<String> lineas = new ArrayList<>();
        StringBuilder linea = new StringBuilder();

        for (String palabra : limpio.split("\\s+")) {
            String candidato = linea.isEmpty()
                    ? palabra
                    : linea + " " + palabra;

            if (anchoTexto(candidato, fuente, tamano)
                    <= anchoMaximo) {
                linea.setLength(0);
                linea.append(candidato);
                continue;
            }

            if (!linea.isEmpty()) {
                lineas.add(linea.toString());
                linea.setLength(0);
            }

            // Cortar palabras excesivamente largas.
            StringBuilder fragmento = new StringBuilder();

            for (int i = 0; i < palabra.length(); i++) {
                String siguiente =
                        fragmento.toString() + palabra.charAt(i);

                if (!fragmento.isEmpty()
                        && anchoTexto(siguiente, fuente, tamano)
                        > anchoMaximo) {

                    lineas.add(fragmento.toString());
                    fragmento.setLength(0);
                }

                fragmento.append(palabra.charAt(i));
            }

            linea.append(fragmento);
        }

        if (!linea.isEmpty()) {
            lineas.add(linea.toString());
        }

        return lineas;
    }

    private float dibujarFila(
            String[] valores,
            float[] anchos,
            boolean encabezado) throws IOException {

        float x = MARGEN;
        float tamano = encabezado ? 9 : 8.5f;
        PDFont fuente = encabezado ? negrita : normal;

        List<List<String>> columnas = new ArrayList<>();
        int maxLineas = 1;

        for (int i = 0; i < valores.length; i++) {
            List<String> lineas = dividir(
                    valores[i],
                    fuente,
                    tamano,
                    anchos[i] - 12
            );

            columnas.add(lineas);
            maxLineas = Math.max(maxLineas, lineas.size());
        }

        float alto = maxLineas * ALTO_LINEA + 14;

        if (alto > formato.getHeight() - 110) {
            throw new IOException(
                    "Una fila del reporte supera el alto de página");
        }

        Color fondo = encabezado ? AZUL : GRIS;
        rectangulo(
                MARGEN,
                y - alto,
                formato.getWidth() - MARGEN * 2,
                alto,
                fondo
        );

        for (int i = 0; i < columnas.size(); i++) {
            float posicion = y - 15;

            for (String linea : columnas.get(i)) {
                texto(
                        linea,
                        x + 6,
                        posicion,
                        fuente,
                        tamano,
                        encabezado ? Color.WHITE : TEXTO
                );

                posicion -= ALTO_LINEA;
            }

            x += anchos[i];
        }

        y -= alto + 2;
        return alto;
    }

    public void tabla(
            String[] encabezados,
            float[] anchos,
            List<String[]> filas) throws IOException {

        if (encabezados.length != anchos.length) {
            throw new IllegalArgumentException(
                    "Las columnas y sus anchos no coinciden");
        }

        float suma = 0;
        for (float ancho : anchos) {
            suma += ancho;
        }

        if (suma > formato.getWidth() - MARGEN * 2 + 0.1f) {
            throw new IllegalArgumentException(
                    "La tabla supera el ancho de página");
        }

        espacio(55);
        dibujarFila(encabezados, anchos, true);

        if (filas.isEmpty()) {
            mensaje("No hay registros disponibles");
            return;
        }

        for (String[] fila : filas) {
            if (fila.length != encabezados.length) {
                throw new IllegalArgumentException(
                        "Fila con cantidad de columnas incorrecta");
            }

            float altoEstimado = calcularAlto(
                    fila, anchos, normal, 8.5f);

            if (y - altoEstimado < 55) {
                nuevaPagina();
                dibujarFila(encabezados, anchos, true);
            }

            dibujarFila(fila, anchos, false);
        }
    }

    private float calcularAlto(
            String[] valores,
            float[] anchos,
            PDFont fuente,
            float tamano) throws IOException {

        int maxLineas = 1;

        for (int i = 0; i < valores.length; i++) {
            int cantidad = dividir(
                    valores[i],
                    fuente,
                    tamano,
                    anchos[i] - 12
            ).size();

            maxLineas = Math.max(maxLineas, cantidad);
        }

        return maxLineas * ALTO_LINEA + 16;
    }

    public void mensaje(String mensaje) throws IOException {
        espacio(25);
        texto(mensaje, MARGEN, y - 8,
                normal, 10, Color.GRAY);
        y -= 25;
    }

    public byte[] finalizar() throws IOException {
        piePagina();
        contenido.close();
        contenido = null;

        ByteArrayOutputStream salida =
                new ByteArrayOutputStream();

        documento.save(salida);
        return salida.toByteArray();
    }
}
