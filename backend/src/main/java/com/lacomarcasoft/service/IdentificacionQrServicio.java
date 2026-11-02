package com.lacomarcasoft.service;

import com.lacomarcasoft.modelo.QrExamenEstudiante;
import com.lacomarcasoft.modelo.Usuario;
import com.lacomarcasoft.repository.QrExamenEstudianteRepositorio;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Objects;

@Service
public class IdentificacionQrServicio {

    private static final int VERSION_QR = 1;
    private static final int LONGITUD_MAXIMA_TOKEN = 8192;

    private final QrExamenEstudianteRepositorio qrRepositorio;
    private final QrExamenServicio qrExamenServicio;
    private final AccesoExamenDocenteServicio accesoExamenDocente;
    private final JdbcTemplate jdbc;

    public IdentificacionQrServicio(
            QrExamenEstudianteRepositorio qrRepositorio,
            QrExamenServicio qrExamenServicio,
            AccesoExamenDocenteServicio accesoExamenDocente,
            JdbcTemplate jdbc) {
        this.qrRepositorio = qrRepositorio;
        this.qrExamenServicio = qrExamenServicio;
        this.accesoExamenDocente = accesoExamenDocente;
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    public ConsultaIngresoServicio.EstudianteIdentificado identificar(
            Long idExamen,
            String token) {

        if (idExamen == null || idExamen <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Identificador de examen invalido"
            );
        }

        String tokenLimpio = token == null ? "" : token.strip();

        if (tokenLimpio.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Debe proporcionar un codigo QR"
            );
        }

        if (tokenLimpio.length() > LONGITUD_MAXIMA_TOKEN) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El codigo QR supera la longitud permitida"
            );
        }

        accesoExamenDocente.verificarExamenActual(idExamen);

        String hash = qrExamenServicio.calcularHash(tokenLimpio);

        QrExamenEstudiante qr = qrRepositorio.findByTokenHash(hash)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Codigo QR no registrado"
                ));

        if (!Boolean.FALSE.equals(qr.getRevocado())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "El codigo QR esta revocado"
            );
        }

        if (qr.getExamen() == null
                || qr.getMateria() == null
                || qr.getEstudiante() == null
                || !idExamen.equals(qr.getExamen().getIdExamen())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "El codigo QR no corresponde al examen seleccionado"
            );
        }

        if (!tokenLimpio.equals(qr.getTokenCifrado())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El codigo QR no coincide con el registro almacenado"
            );
        }

        QrExamenServicio.ContenidoQrExamen contenido;

        try {
            contenido = qrExamenServicio.leerContenido(tokenLimpio);
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El codigo QR no tiene un contenido valido",
                    e
            );
        }

        Usuario estudiante = qr.getEstudiante();

        if (contenido == null
                || contenido.version() != VERSION_QR
                || !Objects.equals(contenido.idExamen(), idExamen)
                || !Objects.equals(
                        contenido.idEstudiante(),
                        estudiante.getIdUsuario())
                || !Objects.equals(
                        contenido.idMateria(),
                        qr.getMateria().getIdMateria())
                || contenido.nonce() == null
                || contenido.nonce().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El contenido del codigo QR es invalido"
            );
        }

        if (!Boolean.TRUE.equals(estudiante.getActivo())
                || estudiante.getRol() == null
                || !"ESTUDIANTE".equalsIgnoreCase(
                        estudiante.getRol().getNombreRol())) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Estudiante no disponible"
            );
        }

        boolean asociadoAlExamen = Boolean.TRUE.equals(
                jdbc.queryForObject("""
                    SELECT EXISTS (
                        SELECT 1
                        FROM academico.examen e
                        JOIN academico.materia_estudiante me
                            ON me.id_materia = e.id_materia
                        WHERE e.id_examen = ?
                          AND me.id_estudiante = ?
                    )
                    """,
                    Boolean.class,
                    idExamen,
                    estudiante.getIdUsuario()
                )
        );

        String nombreCompleto = (
                estudiante.getNombre() + " " + estudiante.getApellido()
        ).trim();

        String fotoPerfil = estudiante.getFotoPerfil();

        return new ConsultaIngresoServicio.EstudianteIdentificado(
                idExamen,
                estudiante.getIdUsuario(),
                estudiante.getCarnetIdentidad(),
                estudiante.getCodigoSis(),
                nombreCompleto,
                asociadoAlExamen,
                estudiante.getCelular(),
                fotoPerfil != null && !fotoPerfil.isBlank()
        );
    }
}
