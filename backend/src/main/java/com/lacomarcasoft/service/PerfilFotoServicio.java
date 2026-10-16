package com.lacomarcasoft.service;

import com.lacomarcasoft.modelo.Usuario;
import com.lacomarcasoft.repository.UsuarioRepositorio;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.UUID;

@Service
public class PerfilFotoServicio {

    private static final long TAMANO_MAXIMO = 2L * 1024 * 1024;

    private final UsuarioRepositorio usuarios;
    private final Path directorio;

    public record FotoPerfil(
        Resource recurso,
        String tipoContenido
    ) {}

    public PerfilFotoServicio(
            UsuarioRepositorio usuarios,
            @Value("${app.perfil.fotos-directorio:./uploads/perfiles}")
            String rutaDirectorio
    ) {
        this.usuarios = usuarios;
        this.directorio = Path.of(rutaDirectorio)
            .toAbsolutePath()
            .normalize();
    }

    public String guardar(Long idUsuario, MultipartFile archivo) {

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

        String tipo = archivo.getContentType();

        if (tipo == null || (
                !tipo.equalsIgnoreCase("image/jpeg")
                && !tipo.equalsIgnoreCase("image/png"))) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Solo se permiten imagenes JPG y PNG"
            );
        }

        String extension = tipo.equalsIgnoreCase("image/png")
            ? ".png" : ".jpg";

        try (InputStream entrada = archivo.getInputStream()) {

            BufferedImage imagen = ImageIO.read(entrada);

            if (imagen == null
                    || imagen.getWidth() < 1
                    || imagen.getHeight() < 1
                    || imagen.getWidth() > 5000
                    || imagen.getHeight() > 5000) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La imagen no es valida"
                );
            }

        } catch (IOException ex) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "No se pudo leer la imagen",
                ex
            );
        }

        try {
            Files.createDirectories(directorio);
        } catch (IOException ex) {
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "No se pudo preparar el almacenamiento",
                ex
            );
        }

        String nombre = UUID.randomUUID().toString() + extension;
        Path destino = directorio.resolve(nombre);
        String anterior = usuario.getFotoPerfil();

        try {
            Files.copy(
                archivo.getInputStream(),
                destino,
                StandardCopyOption.REPLACE_EXISTING
            );

            usuario.setFotoPerfil(nombre);
            usuarios.saveAndFlush(usuario);

        } catch (Exception ex) {
            try {
                Files.deleteIfExists(destino);
            } catch (IOException ignored) {
            }

            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "No se pudo guardar la fotografia",
                ex
            );
        }

        if (anterior != null && !anterior.isBlank()) {
            eliminarAnterior(anterior);
        }

        return nombre;
    }

    public FotoPerfil consultar(Long idUsuario) {

        Usuario usuario = obtenerUsuario(idUsuario);
        String nombre = usuario.getFotoPerfil();

        if (nombre == null || nombre.isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "El usuario no tiene fotografia de perfil"
            );
        }

        Path archivo = rutaSegura(nombre);

        if (!Files.isRegularFile(archivo)
                || !Files.isReadable(archivo)) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "La fotografia no esta disponible"
            );
        }

        String extension = nombre.toLowerCase(Locale.ROOT);

        String tipo = extension.endsWith(".png")
            ? "image/png" : "image/jpeg";

        try {
            Resource recurso = new UrlResource(archivo.toUri());

            return new FotoPerfil(recurso, tipo);

        } catch (MalformedURLException ex) {
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "No se pudo consultar la fotografia",
                ex
            );
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

    private Path rutaSegura(String nombre) {

        Path ruta = directorio.resolve(nombre).normalize();

        if (!ruta.getParent().equals(directorio)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Referencia de fotografia invalida"
            );
        }

        return ruta;
    }

    private void eliminarAnterior(String nombre) {

        try {
            Files.deleteIfExists(rutaSegura(nombre));
        } catch (IOException ignored) {
        }
    }
}
