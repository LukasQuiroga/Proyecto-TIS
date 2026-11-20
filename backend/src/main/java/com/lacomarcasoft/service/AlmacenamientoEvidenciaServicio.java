
package com.lacomarcasoft.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.UUID;

@Service
public class AlmacenamientoEvidenciaServicio {

    private static final long TAMANO_MAXIMO = 5L * 1024 * 1024;

    private final HttpClient cliente;
    private final String baseStorage;
    private final String clave;

    public record Archivo(
            Resource recurso,
            String tipoContenido,
            String extension
    ) {
    }

    public AlmacenamientoEvidenciaServicio(
            @Value("${app.supabase.url}") String supabaseUrl,
            @Value("${app.supabase.evidencias-bucket:evidencias-situaciones}")
            String bucket,
            @Value("${app.supabase.service-role-key}") String clave
    ) {
        this.baseStorage = supabaseUrl.replaceAll("/+$", "")
                + "/storage/v1/object/" + bucket + "/";
        this.clave = clave;
        this.cliente = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public String guardar(Long idSituacion, MultipartFile archivo) {
        if (archivo == null || archivo.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Debe seleccionar un archivo de evidencia"
            );
        }

        if (archivo.getSize() > TAMANO_MAXIMO) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La evidencia no puede superar 5 MB"
            );
        }

        byte[] contenido;

        try {
            contenido = archivo.getBytes();
        } catch (IOException ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "No se pudo leer el archivo de evidencia",
                    ex
            );
        }

        if (contenido.length == 0
                || contenido.length > TAMANO_MAXIMO) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El tamaño de la evidencia no es valido"
            );
        }

        String tipo = identificarTipo(contenido);

        if (tipo == null
                || !tipo.equalsIgnoreCase(archivo.getContentType())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Solo se admiten archivos PDF, JPG o PNG validos"
            );
        }

        String extension = extensionDe(tipo);

        String referencia = "situaciones/"
                + idSituacion
                + "/"
                + UUID.randomUUID()
                + extension;

        HttpRequest peticion = peticion(referencia)
                .header("Content-Type", tipo)
                .POST(HttpRequest.BodyPublishers.ofByteArray(contenido))
                .build();

        HttpResponse<byte[]> respuesta = enviar(peticion);

        if (respuesta.statusCode() != 200
                && respuesta.statusCode() != 201) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "No se pudo guardar la evidencia en Supabase"
            );
        }

        return referencia;
    }

    public Archivo consultar(Long idSituacion, String referencia) {
        if (referencia == null
                || !referencia.matches(
                        "situaciones/" + idSituacion
                                + "/[a-fA-F0-9-]{36}\\.(pdf|png|jpg)"
                )) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Evidencia no encontrada"
            );
        }

        HttpResponse<byte[]> respuesta = enviar(
                peticion(referencia).GET().build()
        );

        if (respuesta.statusCode() == 404) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Archivo de evidencia no encontrado"
            );
        }

        if (respuesta.statusCode() != 200) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "No se pudo recuperar la evidencia"
            );
        }

        String extension = referencia.substring(
                referencia.lastIndexOf('.')
        );

        String tipo = switch (extension) {
            case ".pdf" -> "application/pdf";
            case ".png" -> "image/png";
            default -> "image/jpeg";
        };

        return new Archivo(
                new ByteArrayResource(respuesta.body()),
                tipo,
                extension
        );
    }

    public void eliminar(String referencia) {
        try {
            enviar(peticion(referencia).DELETE().build());
        } catch (RuntimeException ignored) {
        }
    }

    private String identificarTipo(byte[] contenido) {
        if (contenido.length >= 5
                && contenido[0] == '%'
                && contenido[1] == 'P'
                && contenido[2] == 'D'
                && contenido[3] == 'F'
                && contenido[4] == '-') {
            return "application/pdf";
        }

        if (contenido.length >= 8
                && (contenido[0] & 255) == 137
                && contenido[1] == 'P'
                && contenido[2] == 'N'
                && contenido[3] == 'G'
                && contenido[4] == 13
                && contenido[5] == 10
                && contenido[6] == 26
                && contenido[7] == 10) {
            return "image/png";
        }

        if (contenido.length >= 3
                && (contenido[0] & 255) == 255
                && (contenido[1] & 255) == 216
                && (contenido[2] & 255) == 255) {
            return "image/jpeg";
        }

        return null;
    }

    private String extensionDe(String tipo) {
        return switch (tipo) {
            case "application/pdf" -> ".pdf";
            case "image/png" -> ".png";
            default -> ".jpg";
        };
    }

    private HttpRequest.Builder peticion(String referencia) {
        if (!referencia.matches(
                "situaciones/[0-9]+/[a-fA-F0-9-]{36}\\.(pdf|png|jpg)"
        )) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Referencia de evidencia invalida"
            );
        }

        return HttpRequest.newBuilder()
                .uri(URI.create(baseStorage + referencia))
                .timeout(Duration.ofSeconds(30))
                .header("apikey", clave)
                .header("Authorization", "Bearer " + clave);
    }

    private HttpResponse<byte[]> enviar(HttpRequest peticion) {
        try {
            return cliente.send(
                    peticion,
                    HttpResponse.BodyHandlers.ofByteArray()
            );
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Se interrumpio la conexion con Supabase",
                    ex
            );
        } catch (IOException ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "No se pudo conectar con Supabase Storage",
                    ex
            );
        }
    }
}
