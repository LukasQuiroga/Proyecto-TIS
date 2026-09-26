package com.lacomarcasoft.controller;

import com.lacomarcasoft.dto.request.RestablecerContrasenaSolicitud;
import com.lacomarcasoft.dto.request.SolicitarRecuperacionSolicitud;
import com.lacomarcasoft.dto.request.VerificarCodigoSolicitud;
import com.lacomarcasoft.dto.response.MensajeRespuesta;
import com.lacomarcasoft.dto.response.VerificarCodigoRespuesta;
import com.lacomarcasoft.service.RecuperacionContrasenaServicio;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/recuperacion")
@CrossOrigin(origins = "http://localhost:5173")
public class RecuperacionContrasenaControlador {

    private final RecuperacionContrasenaServicio recuperacionServicio;

    public RecuperacionContrasenaControlador(
            RecuperacionContrasenaServicio recuperacionServicio
    ) {
        this.recuperacionServicio = recuperacionServicio;
    }

    @PostMapping("/solicitar")
    public ResponseEntity<MensajeRespuesta> solicitar(
            @Valid @RequestBody SolicitarRecuperacionSolicitud solicitud
    ) {
        recuperacionServicio.solicitarRecuperacion(solicitud.correo());

        return ResponseEntity.ok(
                new MensajeRespuesta(
                        "Si el correo está asociado a una cuenta, recibirás un código de recuperación."
                )
        );
    }

    @PostMapping("/verificar-codigo")
    public ResponseEntity<VerificarCodigoRespuesta> verificarCodigo(
            @Valid @RequestBody VerificarCodigoSolicitud solicitud
    ) {
        return ResponseEntity.ok(
                recuperacionServicio.verificarCodigo(solicitud)
        );
    }

    @PostMapping("/restablecer")
    public ResponseEntity<MensajeRespuesta> restablecer(
            @Valid @RequestBody RestablecerContrasenaSolicitud solicitud
    ) {
        recuperacionServicio.restablecerContrasena(solicitud);

        return ResponseEntity.ok(
                new MensajeRespuesta("Contraseña actualizada correctamente.")
        );
    }
}