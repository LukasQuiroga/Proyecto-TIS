package com.lacomarcasoft.service;

import com.lacomarcasoft.modelo.Examen;
import com.lacomarcasoft.modelo.Materia;
import com.lacomarcasoft.modelo.QrExamenEstudiante;
import com.lacomarcasoft.modelo.Usuario;
import com.lacomarcasoft.repository.ExamenRepositorio;
import com.lacomarcasoft.repository.QrExamenEstudianteRepositorio;

import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
public class QrExamenEnvioServicio {

    private final QrExamenEstudianteRepositorio qrRepositorio;
    private final ExamenRepositorio examenRepositorio;
    private final QrExamenServicio qrExamenServicio;
    private final CorreoServicio correoServicio;

    public QrExamenEnvioServicio(
            QrExamenEstudianteRepositorio qrRepositorio,
            ExamenRepositorio examenRepositorio,
            QrExamenServicio qrExamenServicio,
            CorreoServicio correoServicio
    ) {
        this.qrRepositorio = qrRepositorio;
        this.examenRepositorio = examenRepositorio;
        this.qrExamenServicio = qrExamenServicio;
        this.correoServicio = correoServicio;
    }

    public record ResultadoEnvioQr(
            int total,
            int enviados,
            int fallidos,
            String mensaje
    ) {}

    @Async("qrTaskExecutor")
    @Transactional
    public void enviarPendientesAsync(Long idExamen) {
        procesarPendientes(idExamen);
    }

    @Transactional
    public ResultadoEnvioQr reenviarPendientes(Long idExamen) {
        if (idExamen == null || !examenRepositorio.existsById(idExamen)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Examen no encontrado"
            );
        }

        return procesarPendientes(idExamen);
    }

    private ResultadoEnvioQr procesarPendientes(Long idExamen) {
        List<QrExamenEstudiante> pendientes = qrRepositorio
                .listarPendientesPorExamen(idExamen);

        int enviados = 0;
        int fallidos = 0;

        for (QrExamenEstudiante qr : pendientes) {
            qr.setIntentosEnvio(
                    qr.getIntentosEnvio() == null
                            ? 1
                            : qr.getIntentosEnvio() + 1
            );

            try {
                enviar(qr);
                qr.setEstadoEnvio("ENVIADO");
                qr.setFechaEnvio(
                        OffsetDateTime.now(ZoneOffset.UTC)
                );
                qr.setUltimoError(null);
                enviados++;
            } catch (Exception e) {
                qr.setEstadoEnvio("ERROR");
                qr.setUltimoError(truncarError(e));
                fallidos++;
            }

            qrRepositorio.save(qr);
        }

        return new ResultadoEnvioQr(
                pendientes.size(),
                enviados,
                fallidos,
                mensaje(pendientes.size(), enviados, fallidos)
        );
    }

    private void enviar(QrExamenEstudiante qr) {
        Usuario estudiante = qr.getEstudiante();
        Examen examen = qr.getExamen();
        Materia materia = examen.getMateria();

        if (estudiante == null ||
                estudiante.getCorreo() == null ||
                estudiante.getCorreo().isBlank()) {
            throw new IllegalStateException(
                    "El estudiante no tiene un correo registrado"
            );
        }

        byte[] imagen = qrExamenServicio.generarImagen(
                qr.getTokenCifrado()
        );

        correoServicio.enviarQrExamen(
                estudiante.getCorreo(),
                nombreCompleto(estudiante),
                examen.getNombreExamen(),
                examen.getCodigo(),
                materia.getAsignatura().getNombreAsignatura(),
                materia.getGrupo(),
                examen.getFechaExamen(),
                examen.getHoraInicio(),
                examen.getHoraFin(),
                imagen
        );
    }

    private String nombreCompleto(Usuario usuario) {
        return (usuario.getNombre() + " " + usuario.getApellido()).trim();
    }

    private String truncarError(Exception e) {
        String mensaje = e.getMessage();

        if (mensaje == null || mensaje.isBlank()) {
            mensaje = e.getClass().getSimpleName();
        }

        return mensaje.length() > 500
                ? mensaje.substring(0, 500)
                : mensaje;
    }

    private String mensaje(int total, int enviados, int fallidos) {
        if (total == 0) {
            return "No hay codigos QR pendientes de envio";
        }

        if (fallidos == 0) {
            return enviados + " codigo(s) QR enviado(s) correctamente";
        }

        return enviados + " codigo(s) QR enviado(s) y "
                + fallidos + " con error";
    }
}
