package com.lacomarcasoft.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.HtmlUtils;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


@Service
public class CorreoServicio {


    private static final DateTimeFormatter FORMATO_FECHA =
            DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private static final DateTimeFormatter FORMATO_HORA =
            DateTimeFormatter.ofPattern("HH:mm");

    private static final String URL_BREVO =
            "https://api.brevo.com/v3/smtp/email";


    private final RestTemplate restTemplate;


    @Value("${brevo.api-key}")
    private String apiKey;


    @Value("${brevo.remitente.email}")
    private String correoRemitente;


    @Value("${brevo.remitente.nombre}")
    private String nombreRemitente;



    public CorreoServicio(
            RestTemplate restTemplate
    ){

        this.restTemplate = restTemplate;

    }



    public void enviarCodigoRecuperacion(
            String destinatario,
            String codigo
    ){

        Map<String,Object> correo =
                construirCorreoBase(
                        destinatario,
                        "Código de recuperación de contraseña"
                );

        correo.put(
                "htmlContent",
                """
                <html>
                    <body>
                        <h2>Recuperación de contraseña</h2>

                        <p>Tu código de verificación es:</p>

                        <h1>%s</h1>

                        <p>
                        Este código vence en 10 minutos.
                        </p>

                        <p>
                        Si no solicitaste este cambio,
                        ignora este mensaje.
                        </p>

                    </body>
                </html>
                """.formatted(codigo)
        );

        enviar(correo);

    }


    public void enviarQrExamen(
            String destinatario,
            String nombreEstudiante,
            String nombreExamen,
            String codigoExamen,
            String nombreAsignatura,
            String grupo,
            LocalDate fechaExamen,
            LocalTime horaInicio,
            LocalTime horaFin,
            byte[] imagenQr
    ){

        String nombreAsignaturaTexto = nombreAsignatura == null
                ? ""
                : nombreAsignatura;

        String nombreAsignaturaSeguro =
                HtmlUtils.htmlEscape(nombreAsignaturaTexto);

        String grupoSeguro = HtmlUtils.htmlEscape(
                grupo == null ? "" : grupo
        );

        String nombreExamenSeguro = HtmlUtils.htmlEscape(
                nombreExamen == null ? "" : nombreExamen
        );

        String codigoExamenSeguro = HtmlUtils.htmlEscape(
                codigoExamen == null ? "" : codigoExamen
        );

        String nombreEstudianteSeguro = HtmlUtils.htmlEscape(
                nombreEstudiante == null ? "" : nombreEstudiante
        );

        String fecha = fechaExamen == null
                ? ""
                : fechaExamen.format(FORMATO_FECHA);

        String inicio = horaInicio == null
                ? ""
                : horaInicio.format(FORMATO_HORA);

        String fin = horaFin == null
                ? ""
                : horaFin.format(FORMATO_HORA);

        Map<String,Object> correo = construirCorreoBase(
                destinatario,
                "QR para el examen de " + nombreAsignaturaTexto
                        + " - " + fecha + " " + inicio
        );

        correo.put(
                "htmlContent",
                """
                <html>
                    <body>
                        <h2>QR para tu examen</h2>

                        <p>Hola %s,</p>

                        <p>
                        Se generó tu código QR para el examen
                        <strong>%s</strong> (%s).
                        </p>

                        <p>
                        <strong>Materia:</strong> %s - Grupo %s<br>
                        <strong>Fecha:</strong> %s<br>
                        <strong>Hora:</strong> %s a %s
                        </p>

                        <p>
                        Descarga el archivo <strong>QR.png</strong> adjunto y preséntalo al momento de ingresar al examen. 
                        El código es único para ti y no debe ser compartido.
                        </p>

                        <p>ExamPass</p>
                    </body>
                </html>
                """.formatted(
                        nombreEstudianteSeguro,
                        nombreExamenSeguro,
                        codigoExamenSeguro,
                        nombreAsignaturaSeguro,
                        grupoSeguro,
                        fecha,
                        inicio,
                        fin
                )
        );

        Map<String,Object> attachment = new HashMap<>();
        attachment.put("content", Base64.getEncoder().encodeToString(imagenQr));
        attachment.put("name", "QR.png");

        correo.put("attachment", List.of(attachment));

        enviar(correo);

    }


    private Map<String,Object> construirCorreoBase(
            String destinatario,
            String asunto
    ){

        Map<String,String> sender = new HashMap<>();
        sender.put("email", correoRemitente);
        sender.put("name", nombreRemitente);

        Map<String,String> receptor = new HashMap<>();
        receptor.put("email", destinatario);

        Map<String,Object> correo = new HashMap<>();
        correo.put("sender", sender);
        correo.put("to", List.of(receptor));
        correo.put("subject", asunto);

        return correo;
    }


    private void enviar(Map<String,Object> correo) {

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", apiKey);

        HttpEntity<Map<String,Object>> request =
                new HttpEntity<>(correo, headers);

        restTemplate.exchange(
                URL_BREVO,
                HttpMethod.POST,
                request,
                String.class
        );
    }


    private String nombreSeguro(String valor) {

        String limpio = valor == null ? "" : valor.trim();

        limpio = limpio.replaceAll(
                "[^A-Za-z0-9_-]",
                "_"
        );

        if (limpio.isBlank()) {
            return "estudiante";
        }

        return limpio.length() > 40
                ? limpio.substring(0, 40)
                : limpio;
    }

}
