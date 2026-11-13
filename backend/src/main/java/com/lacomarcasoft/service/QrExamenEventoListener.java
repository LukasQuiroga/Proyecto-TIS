package com.lacomarcasoft.service;

import com.lacomarcasoft.service.evento.QrExamenEnvioSolicitadoEvento;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class QrExamenEventoListener {

    private final QrExamenEnvioServicio envioServicio;

    public QrExamenEventoListener(
            QrExamenEnvioServicio envioServicio
    ) {
        this.envioServicio = envioServicio;
    }

    @TransactionalEventListener(
            phase = TransactionPhase.AFTER_COMMIT,
            fallbackExecution = true
    )
    public void manejarEnvioSolicitado(
            QrExamenEnvioSolicitadoEvento evento
    ) {
        envioServicio.enviarPendientesAsync(evento.idExamen());
    }
}
