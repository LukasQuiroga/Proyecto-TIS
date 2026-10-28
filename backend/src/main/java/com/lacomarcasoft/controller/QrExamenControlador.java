package com.lacomarcasoft.controller;

import com.lacomarcasoft.dto.response.QrExamenRespuesta;
import com.lacomarcasoft.dto.response.ReenvioQrRespuesta;
import com.lacomarcasoft.modelo.QrExamenEstudiante;
import com.lacomarcasoft.repository.ExamenRepositorio;
import com.lacomarcasoft.service.QrExamenEnvioServicio;
import com.lacomarcasoft.service.QrExamenServicio;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/examenes/{idExamen}/qr")
public class QrExamenControlador {

    private final QrExamenServicio qrExamenServicio;
    private final QrExamenEnvioServicio envioServicio;
    private final ExamenRepositorio examenRepositorio;

    public QrExamenControlador(
            QrExamenServicio qrExamenServicio,
            QrExamenEnvioServicio envioServicio,
            ExamenRepositorio examenRepositorio
    ) {
        this.qrExamenServicio = qrExamenServicio;
        this.envioServicio = envioServicio;
        this.examenRepositorio = examenRepositorio;
    }

    @GetMapping
    public ResponseEntity<List<QrExamenRespuesta>> listar(
            @PathVariable Long idExamen
    ) {
        validarExamen(idExamen);

        List<QrExamenRespuesta> respuesta = qrExamenServicio
                .listarPorExamen(idExamen)
                .stream()
                .map(this::convertir)
                .toList();

        return ResponseEntity.ok(respuesta);
    }

    @PostMapping("/reenviar")
    public ResponseEntity<ReenvioQrRespuesta> reenviar(
            @PathVariable Long idExamen
    ) {
        validarExamen(idExamen);

        QrExamenEnvioServicio.ResultadoEnvioQr resultado =
                envioServicio.reenviarPendientes(idExamen);

        return ResponseEntity.ok(
                new ReenvioQrRespuesta(
                        resultado.total(),
                        resultado.enviados(),
                        resultado.fallidos(),
                        resultado.mensaje()
                )
        );
    }

    private void validarExamen(Long idExamen) {
        if (idExamen == null || !examenRepositorio.existsById(idExamen)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Examen no encontrado"
            );
        }
    }

    private QrExamenRespuesta convertir(QrExamenEstudiante qr) {
        return new QrExamenRespuesta(
                qr.getIdQrExamen(),
                qr.getExamen().getIdExamen(),
                qr.getEstudiante().getIdUsuario(),
                (qr.getEstudiante().getNombre() + " "
                        + qr.getEstudiante().getApellido()).trim(),
                qr.getEstudiante().getCorreo(),
                qr.getEstadoEnvio(),
                qr.getFechaCreacion(),
                qr.getFechaEnvio(),
                qr.getIntentosEnvio(),
                qr.getUltimoError(),
                qr.getRevocado()
        );
    }
}
