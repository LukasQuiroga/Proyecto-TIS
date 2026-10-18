
package com.lacomarcasoft.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class AuditoriaQrServicio {

    private static final Logger logger =
            LoggerFactory.getLogger(AuditoriaQrServicio.class);

    private final LogActividadServicio logActividadServicio;
    private final ApplicationEventPublisher publicadorEventos;
    private final TransactionTemplate transaccionAuditoria;

    public record EventoAuditoriaQr(
            Long idUsuario,
            String tipoAccion,
            Long idMateria
    ) {}

    public AuditoriaQrServicio(
            LogActividadServicio logActividadServicio,
            ApplicationEventPublisher publicadorEventos,
            PlatformTransactionManager transactionManager
    ) {
        this.logActividadServicio = logActividadServicio;
        this.publicadorEventos = publicadorEventos;

        this.transaccionAuditoria =
                new TransactionTemplate(transactionManager);

        this.transaccionAuditoria.setPropagationBehavior(
                TransactionDefinition.PROPAGATION_REQUIRES_NEW
        );
    }

    public void registrarExito(
            Long idUsuario,
            String tipoAccion,
            Long idMateria
    ) {
        publicadorEventos.publishEvent(
                new EventoAuditoriaQr(
                        idUsuario,
                        tipoAccion,
                        idMateria
                )
        );
    }

    @TransactionalEventListener(
            phase = TransactionPhase.AFTER_COMMIT
    )
    public void procesarEventoExitoso(
            EventoAuditoriaQr evento
    ) {
        guardarAuditoria(
                evento.idUsuario(),
                evento.tipoAccion(),
                evento.idMateria(),
                true
        );
    }

    public void registrarFallo(
            Long idUsuario,
            String tipoAccion,
            Long idMateria
    ) {
        guardarAuditoria(
                idUsuario,
                tipoAccion,
                idMateria,
                false
        );
    }

    private void guardarAuditoria(
            Long idUsuario,
            String tipoAccion,
            Long idMateria,
            boolean exitosa
    ) {
        try {
            String descripcion = exitosa
                    ? "Operacion QR completada. Materia ID: " + idMateria
                    : "Operacion QR rechazada. Materia ID: " + idMateria;

            transaccionAuditoria.executeWithoutResult(estado -> {
                logActividadServicio.registrar(
                        idUsuario,
                        tipoAccion,
                        descripcion,
                        null,
                        exitosa
                );
            });

        } catch (Exception e) {
            logger.error(
                    "No se pudo registrar la auditoria QR. Tipo: {}, materia: {}",
                    tipoAccion,
                    idMateria,
                    e
            );
        }
    }
}
