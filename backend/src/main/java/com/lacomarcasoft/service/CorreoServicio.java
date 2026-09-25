package com.lacomarcasoft.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class CorreoServicio {

    private static final Logger LOGGER = LoggerFactory.getLogger(CorreoServicio.class);

    private final JavaMailSender mailSender;
    private final boolean envioHabilitado;
    private final String remitente;

    public CorreoServicio(
            JavaMailSender mailSender,
            @Value("${app.mail.enabled:false}") boolean envioHabilitado,
            @Value("${app.mail.from:no-reply@exampass.local}") String remitente
    ) {
        this.mailSender = mailSender;
        this.envioHabilitado = envioHabilitado;
        this.remitente = remitente;
    }

    public void enviarCodigoRecuperacion(String destinatario, String codigo) {

        if (!envioHabilitado) {
            LOGGER.warn(
                    "MAIL_ENABLED=false. Código de recuperación para {}: {}",
                    destinatario,
                    codigo
            );
            return;
        }

        SimpleMailMessage mensaje = new SimpleMailMessage();
        mensaje.setFrom(remitente);
        mensaje.setTo(destinatario);
        mensaje.setSubject("Código de recuperación de contraseña");
        mensaje.setText(
                "Tu código de verificación es: " + codigo + "\n\n" +
                "Este código vence en 10 minutos y solo puede utilizarse una vez.\n" +
                "Si no solicitaste este cambio, ignora este mensaje."
        );

        mailSender.send(mensaje);
    }
}
