package com.lacomarcasoft.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import com.lacomarcasoft.modelo.Examen;
import com.lacomarcasoft.modelo.QrExamenEstudiante;
import com.lacomarcasoft.modelo.Usuario;
import com.lacomarcasoft.repository.ExamenEstudianteRepositorio;
import com.lacomarcasoft.repository.MateriaEstudianteRepositorio;
import com.lacomarcasoft.repository.QrExamenEstudianteRepositorio;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.EnumMap;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class QrExamenServicio {

    private static final int TAMANO_QR = 320;
    private static final int VERSION_CONTENIDO = 1;

    private final QrExamenEstudianteRepositorio qrRepositorio;
    private final MateriaEstudianteRepositorio materiaEstudianteRepositorio;
    private final ExamenEstudianteRepositorio examenEstudianteRepositorio;
    private final QrTokenCifradoServicio cifradoServicio;
    private final JsonMapper jsonMapper;

    public QrExamenServicio(
            QrExamenEstudianteRepositorio qrRepositorio,
            MateriaEstudianteRepositorio materiaEstudianteRepositorio,
            ExamenEstudianteRepositorio examenEstudianteRepositorio,
            QrTokenCifradoServicio cifradoServicio
    ) {
        this.qrRepositorio = qrRepositorio;
        this.materiaEstudianteRepositorio = materiaEstudianteRepositorio;
        this.examenEstudianteRepositorio = examenEstudianteRepositorio;
        this.cifradoServicio = cifradoServicio;
        this.jsonMapper = JsonMapper.builder().build();
    }

    public record ContenidoQrExamen(
            int version,
            Long idExamen,
            Long idEstudiante,
            Long idMateria,
            String nonce
    ) {}

    @Transactional
    public List<QrExamenEstudiante> generarFaltantesParaExamen(
            Examen examen
    ) {
        validarExamenProgramado(examen);

        List<Usuario> estudiantes = materiaEstudianteRepositorio
                .listarEstudiantesActivosPorMateria(
                        examen.getMateria().getIdMateria()
                );

        return estudiantes.stream()
                .map(estudiante -> generarParaEstudiante(examen, estudiante))
                .flatMap(Optional::stream)
                .toList();
    }

    @Transactional
    public Optional<QrExamenEstudiante> generarParaEstudiante(
            Examen examen,
            Usuario estudiante
    ) {
        validarExamenProgramado(examen);

        if (estudiante == null ||
                estudiante.getIdUsuario() == null ||
                !Boolean.TRUE.equals(estudiante.getActivo())) {
            return Optional.empty();
        }

        Long idExamen = examen.getIdExamen();
        Long idEstudiante = estudiante.getIdUsuario();

        Optional<QrExamenEstudiante> existente = qrRepositorio
                .findByExamen_IdExamenAndEstudiante_IdUsuario(
                        idExamen,
                        idEstudiante
                );

        if (existente.isPresent() &&
                !Boolean.TRUE.equals(existente.get().getRevocado())) {
            return Optional.empty();
        }

        examenEstudianteRepositorio.insertarSiNoExiste(
                idExamen,
                idEstudiante
        );

        String token = crearToken(
                idExamen,
                idEstudiante,
                examen.getMateria().getIdMateria()
        );

        QrExamenEstudiante qr = existente.orElseGet(
                QrExamenEstudiante::new
        );

        qr.setExamen(examen);
        qr.setEstudiante(estudiante);
        qr.setMateria(examen.getMateria());
        qr.setTokenCifrado(token);
        qr.setTokenHash(calcularHash(token));
        qr.setEstadoEnvio("PENDIENTE");
        qr.setIntentosEnvio(0);
        qr.setUltimoError(null);
        qr.setRevocado(false);

        return Optional.of(qrRepositorio.save(qr));
    }

    @Transactional
    public void marcarPendientesParaReenvio(Long idExamen) {
        List<QrExamenEstudiante> codigos = qrRepositorio
                .findByExamen_IdExamen(idExamen);

        codigos.stream()
                .filter(qr -> !Boolean.TRUE.equals(qr.getRevocado()))
                .forEach(qr -> {
                    qr.setEstadoEnvio("PENDIENTE");
                    qr.setUltimoError(null);
                });

        qrRepositorio.saveAll(codigos);
    }

    public String crearToken(
            Long idExamen,
            Long idEstudiante,
            Long idMateria
    ) {
        ContenidoQrExamen contenido = new ContenidoQrExamen(
                VERSION_CONTENIDO,
                idExamen,
                idEstudiante,
                idMateria,
                UUID.randomUUID().toString()
        );

        try {
            String json = jsonMapper.writeValueAsString(contenido);
            return cifradoServicio.cifrar(json);
        } catch (JacksonException e) {
            throw new IllegalStateException(
                    "No se pudo construir el contenido del QR",
                    e
            );
        }
    }

    public ContenidoQrExamen leerContenido(String token) {
        try {
            String json = cifradoServicio.descifrar(token);
            return jsonMapper.readValue(
                    json,
                    ContenidoQrExamen.class
            );
        } catch (JacksonException e) {
            throw new IllegalStateException(
                    "El contenido del QR no tiene un formato valido",
                    e
            );
        }
    }

    public byte[] generarImagen(String token) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException(
                    "El token del QR no puede estar vacio"
            );
        }

        Map<EncodeHintType, Object> pistas = new EnumMap<>(
                EncodeHintType.class
        );
        pistas.put(EncodeHintType.CHARACTER_SET, StandardCharsets.UTF_8.name());
        pistas.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M);
        pistas.put(EncodeHintType.MARGIN, 1);

        try {
            BitMatrix matriz = new QRCodeWriter().encode(
                    token,
                    BarcodeFormat.QR_CODE,
                    TAMANO_QR,
                    TAMANO_QR,
                    pistas
            );

            ByteArrayOutputStream salida = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matriz, "PNG", salida);

            byte[] bytes = salida.toByteArray();
            if (bytes == null || bytes.length == 0) {
                throw new IllegalStateException("Imagen QR vacía");
            }
            return bytes;
        } catch (WriterException | IOException e) {
            throw new IllegalStateException(
                    "No se pudo generar la imagen del QR",
                    e
            );
        }
    }

    public String calcularHash(String token) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException(
                    "El token QR no puede estar vacio"
            );
        }

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(
                    token.getBytes(StandardCharsets.UTF_8)
            );

            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(
                    "No se pudo calcular el hash del QR",
                    e
            );
        }
    }

    @Transactional(readOnly = true)
    public List<QrExamenEstudiante> listarPorExamen(Long idExamen) {
        return qrRepositorio.listarConDetallePorExamen(idExamen);
    }

    @Transactional(readOnly = true)
    public List<QrExamenEstudiante> listarPendientesPorExamen(
            Long idExamen
    ) {
        return qrRepositorio.listarPendientesPorExamen(idExamen);
    }

    private void validarExamenProgramado(Examen examen) {
        if (examen == null ||
                examen.getIdExamen() == null ||
                examen.getMateria() == null ||
                examen.getFechaExamen() == null ||
                examen.getHoraInicio() == null ||
                examen.getHoraFin() == null) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "El examen debe tener fecha y hora antes de generar los QR"
            );
        }
    }
}
