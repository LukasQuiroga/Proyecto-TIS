package com.lacomarcasoft.service;

import jakarta.annotation.PostConstruct;
import org.opencv.core.Core;
import org.opencv.core.Mat;
import org.opencv.core.MatOfByte;
import org.opencv.core.MatOfRect;
import org.opencv.core.Rect;
import org.opencv.core.Size;
import org.opencv.imgcodecs.Imgcodecs;
import org.opencv.imgproc.Imgproc;
import org.opencv.objdetect.CascadeClassifier;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@Component
public class ValidadorFotoCarnet {

    private CascadeClassifier detector;

    @PostConstruct
    public void iniciar() {
        try {
            nu.pattern.OpenCV.loadLocally();
            var recurso = new ClassPathResource("opencv/haarcascade_frontalface_default.xml");
            Path temporal = Files.createTempFile("exampass-rostro-", ".xml");
            try {
                Files.copy(recurso.getInputStream(), temporal,
                    java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                detector = new CascadeClassifier(temporal.toString());
                if (detector.empty()) {
                    throw new IllegalStateException("No se pudo cargar el detector facial");
                }
            } finally {
                Files.deleteIfExists(temporal);
            }
        } catch (IOException | RuntimeException | LinkageError ex) {

            throw new IllegalStateException("No se pudo inicializar la validación de fotos carnet", ex);
        }
    }

    public void validar(byte[] contenido) {
        Mat buffer = new MatOfByte(contenido);
        Mat imagen = new Mat();
        Mat gris = new Mat();
        MatOfRect rostros = new MatOfRect();
        try {
            imagen = Imgcodecs.imdecode(buffer, Imgcodecs.IMREAD_COLOR);
            if (imagen.empty()) {
                rechazar("No se pudo leer la fotografía");
            }

            int ancho = imagen.cols();
            int alto = imagen.rows();
            Imgproc.cvtColor(imagen, gris, Imgproc.COLOR_BGR2GRAY);
            Imgproc.equalizeHist(gris, gris);
            detector.detectMultiScale(gris, rostros, 1.1, 5, 0,
                new Size(30, 30),
                new Size());
            Rect[] encontrados = rostros.toArray();
            if (encontrados.length != 1) {
                rechazar(encontrados.length == 0
                    ? "No se detectó un rostro frontal claro. Mira de frente, sin cubrirte la cara"
                    : "La fotografía debe mostrar solamente a una persona");
            }
            Rect cara = encontrados[0];
            double proporcionCara = (double) cara.width / ancho;
            double centroHorizontal = (cara.x + cara.width / 2.0) / ancho;
            double centroVertical = (cara.y + cara.height / 2.0) / alto;
            if (proporcionCara < 0.15 || proporcionCara > 0.90
                || centroHorizontal < 0.25 || centroHorizontal > 0.75
                || centroVertical < 0.15 || centroVertical > 0.80) {
                rechazar("La fotografía debe mostrar un rostro frontal suficientemente visible y centrado");
            }
        } catch (org.opencv.core.CvException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "No se pudo analizar la fotografía", ex);
        } finally {
            rostros.release();
            gris.release();
            imagen.release();
            buffer.release();
        }
    }

    private static void rechazar(String mensaje) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, mensaje);
    }
}
