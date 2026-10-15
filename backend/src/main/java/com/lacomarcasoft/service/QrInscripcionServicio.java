
package com.lacomarcasoft.service;

import com.lacomarcasoft.modelo.Materia;
import com.lacomarcasoft.modelo.QrInscripcion;
import com.lacomarcasoft.repository.MateriaRepositorio;
import com.lacomarcasoft.repository.QrInscripcionRepositorio;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class QrInscripcionServicio {

    private static final int DURACION_MINUTOS = 10;
    private static final int TAMANO_TOKEN_BYTES = 32;

    private final SecureRandom secureRandom = new SecureRandom();

    private final QrInscripcionRepositorio qrRepositorio;
    private final MateriaRepositorio materiaRepositorio;
    private final QrTokenCifradoServicio cifradoServicio;

    public QrInscripcionServicio(
            QrInscripcionRepositorio qrRepositorio,
            MateriaRepositorio materiaRepositorio,
            QrTokenCifradoServicio cifradoServicio
    ) {
        this.qrRepositorio = qrRepositorio;
        this.materiaRepositorio = materiaRepositorio;
        this.cifradoServicio = cifradoServicio;
    }

    public record ResultadoGeneracionQr(
            Long idQr,
            Long idMateria,
            String token,
            OffsetDateTime fechaExpiracion
    ) {}

    public record ResultadoConsultaQr(
            Long idQr,
            Long idMateria,
            String token,
            OffsetDateTime fechaExpiracion,
            String estado
    ) {}

    @Transactional
    public ResultadoGeneracionQr generarQr(
            Long idMateria,
            Long idDocente
    ) {
        if (idMateria == null || idDocente == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La materia y el docente son obligatorios"
            );
        }

        Materia materia = materiaRepositorio.bloquearMateria(idMateria)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "La materia no existe"
                ));

        if (materia.getDocente() == null ||
                !idDocente.equals(materia.getDocente().getIdUsuario())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "No tiene permiso para generar el QR de esta materia"
            );
        }

        if (!Boolean.TRUE.equals(materia.getDocente().getActivo())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "El docente no se encuentra activo"
            );
        }

        OffsetDateTime ahora = OffsetDateTime.now(ZoneOffset.UTC);

        boolean existeQrActivo = qrRepositorio
                .findByMateria_IdMateriaOrderByFechaCreacionDesc(idMateria)
                .stream()
                .anyMatch(qr ->
                        !qr.isRevocado() &&
                        qr.getFechaExpiracion().isAfter(ahora)
                );

        if (existeQrActivo) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "La materia ya tiene un código QR activo."
            );
        }

        byte[] bytesToken = new byte[TAMANO_TOKEN_BYTES];
        secureRandom.nextBytes(bytesToken);

        String token = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytesToken);

        String tokenHash = calcularHash(token);

        OffsetDateTime expiracion = ahora.plusMinutes(DURACION_MINUTOS);

        QrInscripcion qr = new QrInscripcion();
        qr.setMateria(materia);
        qr.setTokenHash(tokenHash);
        qr.setTokenCifrado(cifradoServicio.cifrar(token));
        qr.setFechaExpiracion(expiracion);
        qr.setRevocado(false);

        QrInscripcion guardado = qrRepositorio.save(qr);

        return new ResultadoGeneracionQr(
                guardado.getIdQr(),
                materia.getIdMateria(),
                token,
                guardado.getFechaExpiracion()
        );
    }

    @Transactional(readOnly = true)
    public ResultadoConsultaQr consultarQrActivo(
            Long idMateria,
            Long idDocente
    ) {
        if (idMateria == null || idDocente == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La materia y el docente son obligatorios"
            );
        }

        Materia materia = materiaRepositorio.findById(idMateria)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "La materia no existe"
                ));

        if (materia.getDocente() == null ||
                !idDocente.equals(materia.getDocente().getIdUsuario())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "No tiene permiso para consultar el QR de esta materia"
            );
        }

        if (!Boolean.TRUE.equals(materia.getDocente().getActivo())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "El docente no se encuentra activo"
            );
        }

        OffsetDateTime ahora = OffsetDateTime.now(ZoneOffset.UTC);

        QrInscripcion qrActivo = qrRepositorio
                .findByMateria_IdMateriaOrderByFechaCreacionDesc(idMateria)
                .stream()
                .filter(qr -> !qr.isRevocado())
                .filter(qr -> qr.getFechaExpiracion().isAfter(ahora))
                .findFirst()
                .orElse(null);

        if (qrActivo == null) {
            return null;
        }

        if (qrActivo.getTokenCifrado() == null) {
            return new ResultadoConsultaQr(
                    qrActivo.getIdQr(),
                    idMateria,
                    null,
                    qrActivo.getFechaExpiracion(),
                    "ACTIVO_SIN_TOKEN_RECUPERABLE"
            );
        }

        String token = cifradoServicio.descifrar(
                qrActivo.getTokenCifrado()
        );

        if (!calcularHash(token).equals(qrActivo.getTokenHash())) {
            throw new IllegalStateException(
                    "El token recuperado no coincide con el QR registrado"
            );
        }

        return new ResultadoConsultaQr(
                qrActivo.getIdQr(),
                idMateria,
                token,
                qrActivo.getFechaExpiracion(),
                "ACTIVO"
        );
    }

    public String calcularHash(String token) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException(
                    "El token QR no puede estar vacio"
            );
        }

        try {
            MessageDigest digest = MessageDigest
                    .getInstance("SHA-256");

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
}
