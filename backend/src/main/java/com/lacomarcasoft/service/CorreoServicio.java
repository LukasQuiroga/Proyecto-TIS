package com.lacomarcasoft.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;


@Service
public class CorreoServicio {


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

        String url =
                "https://api.brevo.com/v3/smtp/email";



        HttpHeaders headers =
                new HttpHeaders();


        headers.setContentType(
                MediaType.APPLICATION_JSON
        );


        headers.set(
                "api-key",
                apiKey
        );



        Map<String,String> sender =
                new HashMap<>();


        sender.put(
                "email",
                correoRemitente
        );


        sender.put(
                "name",
                nombreRemitente
        );



        Map<String,String> receptor =
                new HashMap<>();


        receptor.put(
                "email",
                destinatario
        );



        Map<String,Object> correo =
                new HashMap<>();


        correo.put(
                "sender",
                sender
        );


        correo.put(
                "to",
                List.of(receptor)
        );


        correo.put(
                "subject",
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



        HttpEntity<Map<String,Object>> request =
                new HttpEntity<>(
                        correo,
                        headers
                );



        restTemplate.exchange(
                url,
                HttpMethod.POST,
                request,
                String.class
        );

    }

}