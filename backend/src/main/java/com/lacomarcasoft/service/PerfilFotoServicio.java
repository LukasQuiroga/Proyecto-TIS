package com.lacomarcasoft.service;

import com.lacomarcasoft.modelo.Usuario;
import com.lacomarcasoft.repository.UsuarioRepositorio;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Iterator;
import java.util.Locale;
import java.util.UUID;

@Service
public class PerfilFotoServicio {

    private static final long TAMANO_MAXIMO = 2L * 1024 * 1024;

    private final UsuarioRepositorio usuarios;
    private final ValidadorFotoCarnet validadorFotoCarnet;
    private final HttpClient cliente;
    private final String baseStorage;
    private final String clave;

    public record FotoPerfil(
        Resource recurso,
        String tipoContenido
    ) {}

    public PerfilFotoServicio(
            UsuarioRepositorio usuarios,
            ValidadorFotoCarnet validadorFotoCarnet,
            @Value("${app.supabase.url}") String supabaseUrl,
            @Value("${app.supabase.bucket:fotos-perfil}") String bucket,
            @Value("${app.supabase.service-role-key}") String clave
    ) {
        this.usuarios = usuarios;
        this.validadorFotoCarnet = validadorFotoCarnet;
        this.clave = clave;

        String url = supabaseUrl.replaceAll("/+$", "");

        this.baseStorage =
            url + "/storage/v1/object/" + bucket + "/";

        this.cliente = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    }

    public String guardar(
            Long idUsuario,
            MultipartFile archivo
    ) {
        Usuario usuario = obtenerUsuario(idUsuario);

        if (archivo == null || archivo.isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Debe seleccionar una fotografia"
            );
        }

        if (archivo.getSize() > TAMANO_MAXIMO) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "La fotografia no puede superar 2 MB"
            );
        }

        byte[] contenido;

        try {
            contenido = archivo.getBytes();
        } catch (IOException ex) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "No se pudo leer la fotografia",
                ex
            );
        }

        String tipo = validarImagen(
            contenido,
            archivo.getContentType()
        );

        validadorFotoCarnet.validar(contenido);

        String extension = tipo.equals("image/png")
            ? ".png"
            : ".jpg";

        String referencia =
            "usuarios/" +
            idUsuario +
            "/" +
            UUID.randomUUID() +
            extension;

        HttpRequest peticion = peticion(referencia)
            .header("Content-Type", tipo)
            .POST(
                HttpRequest.BodyPublishers.ofByteArray(contenido)
            )
            .build();

        HttpResponse<byte[]> respuesta = enviar(peticion);

        if (respuesta.statusCode() != 200
                && respuesta.statusCode() != 201) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "No se pudo subir la fotografia a Supabase"
            );
        }

        String anterior = usuario.getFotoPerfil();

        try {
            usuario.setFotoPerfil(referencia);
            usuarios.saveAndFlush(usuario);
        } catch (RuntimeException ex) {
            eliminarRemoto(referencia);

            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "No se pudo actualizar la fotografia del usuario",
                ex
            );
        }

        if (anterior != null
                && anterior.startsWith("usuarios/")
                && !anterior.equals(referencia)) {
            eliminarRemoto(anterior);
        }

        return referencia;
    }

    public FotoPerfil consultar(Long idUsuario) {
        Usuario usuario = obtenerUsuario(idUsuario);

        String referencia = usuario.getFotoPerfil();

        if (referencia == null || referencia.isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "El usuario no tiene fotografia de perfil"
            );
        }

        if (!referencia.startsWith(
                "usuarios/" + idUsuario + "/")) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "La fotografia aun no esta disponible en Supabase"
            );
        }

        HttpRequest peticion = peticion(referencia)
            .GET()
            .build();

        HttpResponse<byte[]> respuesta = enviar(peticion);

        if (respuesta.statusCode() == 404) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Fotografia no encontrada"
            );
        }

        if (respuesta.statusCode() != 200) {
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "No se pudo recuperar la fotografia"
            );
        }

        String tipo = referencia
            .toLowerCase(Locale.ROOT)
            .endsWith(".png")
                ? "image/png"
                : "image/jpeg";

        return new FotoPerfil(
            new ByteArrayResource(respuesta.body()),
            tipo
        );
    }

    private String validarImagen(
            byte[] contenido,
            String tipoDeclarado
    ) {
        if (contenido.length == 0
                || contenido.length > TAMANO_MAXIMO) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "El tamaño de la fotografia no es valido"
            );
        }

        if (!"image/png".equalsIgnoreCase(tipoDeclarado)
                && !"image/jpeg".equalsIgnoreCase(tipoDeclarado)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Solo se permiten imagenes JPG y PNG"
            );
        }

        try (
            ImageInputStream entrada = ImageIO.createImageInputStream(
                new ByteArrayInputStream(contenido)
            )
        ) {
            if (entrada == null) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La fotografia no es valida"
                );
            }

            Iterator<ImageReader> lectores =
                ImageIO.getImageReaders(entrada);

            if (!lectores.hasNext()) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El archivo no contiene una imagen valida"
                );
            }

            ImageReader lector = lectores.next();

            try {
                lector.setInput(entrada);

                String formato = lector
                    .getFormatName()
                    .toLowerCase(Locale.ROOT);

                String tipoReal;

                if ("png".equals(formato)) {
                    tipoReal = "image/png";
                } else if ("jpeg".equals(formato)
                        || "jpg".equals(formato)) {
                    tipoReal = "image/jpeg";
                } else {
                    throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Formato de imagen no permitido"
                    );
                }

                if (!tipoReal.equalsIgnoreCase(tipoDeclarado)) {
                    throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "El contenido no coincide con el formato declarado"
                    );
                }

                int ancho = lector.getWidth(0);
                int alto = lector.getHeight(0);

                if (ancho < 1 || alto < 1
                        || ancho > 5000 || alto > 5000) {
                    throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Las dimensiones de la imagen no son validas"
                    );
                }

                if (lector.read(0) == null) {
                    throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "No se pudo decodificar la fotografia"
                    );
                }

                return tipoReal;
            } finally {
                lector.dispose();
            }
        } catch (IOException ex) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "La fotografia esta dañada o no es valida",
                ex
            );
        }
    }

    private HttpRequest.Builder peticion(String referencia) {
        if (!referencia.matches(
                "usuarios/[0-9]+/[a-fA-F0-9-]{36}\\.(jpg|png)"
        )) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Referencia de fotografia invalida"
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

    private void eliminarRemoto(String referencia) {
        try {
            HttpRequest peticion = peticion(referencia)
                .DELETE()
                .build();

            enviar(peticion);
        } catch (RuntimeException ignored) {
        }
    }

    private Usuario obtenerUsuario(Long idUsuario) {
        Usuario usuario = usuarios.findById(idUsuario)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Usuario no encontrado"
            ));

        if (!Boolean.TRUE.equals(usuario.getActivo())) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "La cuenta se encuentra inactiva"
            );
        }

        return usuario;
    }
}
