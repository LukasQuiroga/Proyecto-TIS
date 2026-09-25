package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.request.RestablecerContrasenaSolicitud;
import com.lacomarcasoft.dto.request.VerificarCodigoSolicitud;
import com.lacomarcasoft.dto.response.VerificarCodigoRespuesta;
import com.lacomarcasoft.modelo.RecuperacionContrasena;
import com.lacomarcasoft.modelo.Usuario;
import com.lacomarcasoft.repository.RecuperacionContrasenaRepositorio;
import com.lacomarcasoft.repository.UsuarioRepositorio;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

@Service
public class RecuperacionContrasenaServicio {

    private static final int MINUTOS_VIGENCIA = 10;
    private static final int MAX_INTENTOS = 5;
    private static final int SEGUNDOS_ENTRE_ENVIOS = 60;

    private final UsuarioRepositorio usuarioRepositorio;
    private final RecuperacionContrasenaRepositorio recuperacionRepositorio;
    private final PasswordEncoder passwordEncoder;
    private final CorreoServicio correoServicio;
    private final SecureRandom secureRandom = new SecureRandom();

    public RecuperacionContrasenaServicio(
            UsuarioRepositorio usuarioRepositorio,
            RecuperacionContrasenaRepositorio recuperacionRepositorio,
            PasswordEncoder passwordEncoder,
            CorreoServicio correoServicio
    ) {
        this.usuarioRepositorio = usuarioRepositorio;
        this.recuperacionRepositorio = recuperacionRepositorio;
        this.passwordEncoder = passwordEncoder;
        this.correoServicio = correoServicio;
    }

    @Transactional
    public void solicitarRecuperacion(String correo) {

        Optional<Usuario> usuarioOptional = usuarioRepositorio.findByCorreo(correo.trim());

        // La respuesta HTTP es genérica aunque el correo no exista.
        if (usuarioOptional.isEmpty()) {
            return;
        }

        Usuario usuario = usuarioOptional.get();

        Optional<RecuperacionContrasena> solicitudActual =
                recuperacionRepositorio
                        .findTopByUsuarioAndUsadoFalseOrderByFechaCreacionDesc(usuario);

        if (solicitudActual.isPresent()) {
            LocalDateTime siguienteEnvioPermitido =
                    solicitudActual.get().getFechaCreacion().plusSeconds(SEGUNDOS_ENTRE_ENVIOS);

            if (LocalDateTime.now().isBefore(siguienteEnvioPermitido)) {
                return;
            }
        }

        invalidarSolicitudesPendientes(usuario);

        String codigo = String.format("%06d", secureRandom.nextInt(1_000_000));
        LocalDateTime ahora = LocalDateTime.now();

        RecuperacionContrasena recuperacion = new RecuperacionContrasena();
        recuperacion.setUsuario(usuario);
        recuperacion.setCodigoHash(passwordEncoder.encode(codigo));
        recuperacion.setFechaCreacion(ahora);
        recuperacion.setFechaExpiracion(ahora.plusMinutes(MINUTOS_VIGENCIA));
        recuperacion.setIntentosFallidos(0);
        recuperacion.setCodigoVerificado(false);
        recuperacion.setUsado(false);

        recuperacionRepositorio.save(recuperacion);
        correoServicio.enviarCodigoRecuperacion(usuario.getCorreo(), codigo);
    }

    @Transactional
    public VerificarCodigoRespuesta verificarCodigo(VerificarCodigoSolicitud solicitud) {

        Usuario usuario = usuarioRepositorio.findByCorreo(solicitud.correo().trim())
                .orElseThrow(() -> new IllegalArgumentException("El código ingresado no es válido."));

        RecuperacionContrasena recuperacion = obtenerSolicitudActiva(usuario);
        validarVigencia(recuperacion);

        if (recuperacion.getIntentosFallidos() >= MAX_INTENTOS) {
            recuperacion.setUsado(true);
            recuperacionRepositorio.save(recuperacion);
            throw new IllegalArgumentException(
                    "Se superó el límite de intentos. Solicita un nuevo código."
            );
        }

        if (!passwordEncoder.matches(solicitud.codigo(), recuperacion.getCodigoHash())) {
            int intentos = recuperacion.getIntentosFallidos() + 1;
            recuperacion.setIntentosFallidos(intentos);

            if (intentos >= MAX_INTENTOS) {
                recuperacion.setUsado(true);
            }

            recuperacionRepositorio.save(recuperacion);

            if (intentos >= MAX_INTENTOS) {
                throw new IllegalArgumentException(
                        "Se superó el límite de intentos. Solicita un nuevo código."
                );
            }

            throw new IllegalArgumentException("El código ingresado no es válido.");
        }

        String token = generarTokenSeguro();
        recuperacion.setCodigoVerificado(true);
        recuperacion.setTokenHash(passwordEncoder.encode(token));
        recuperacionRepositorio.save(recuperacion);

        return new VerificarCodigoRespuesta(
                "Código validado correctamente.",
                token
        );
    }

    @Transactional
    public void restablecerContrasena(RestablecerContrasenaSolicitud solicitud) {

        if (!solicitud.nuevaContrasena().equals(solicitud.confirmarContrasena())) {
            throw new IllegalArgumentException("Las contraseñas no coinciden.");
        }

        Usuario usuario = usuarioRepositorio.findByCorreo(solicitud.correo().trim())
                .orElseThrow(() -> new IllegalArgumentException("La solicitud de recuperación no es válida."));

        RecuperacionContrasena recuperacion = obtenerSolicitudActiva(usuario);
        validarVigencia(recuperacion);

        if (!Boolean.TRUE.equals(recuperacion.getCodigoVerificado()) || recuperacion.getTokenHash() == null) {
            throw new IllegalArgumentException("Primero debes validar el código de verificación.");
        }

        if (!passwordEncoder.matches(solicitud.token(), recuperacion.getTokenHash())) {
            throw new IllegalArgumentException("La solicitud de recuperación no es válida o ya expiró.");
        }

        if (esMismaContrasena(solicitud.nuevaContrasena(), usuario.getContrasena())) {
            throw new IllegalArgumentException("La nueva contraseña debe ser diferente de la anterior.");
        }

        usuario.setContrasena(passwordEncoder.encode(solicitud.nuevaContrasena()));
        usuarioRepositorio.save(usuario);

        invalidarSolicitudesPendientes(usuario);
    }

    private RecuperacionContrasena obtenerSolicitudActiva(Usuario usuario) {
        return recuperacionRepositorio
                .findTopByUsuarioAndUsadoFalseOrderByFechaCreacionDesc(usuario)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No existe una solicitud de recuperación vigente."
                ));
    }

    private void validarVigencia(RecuperacionContrasena recuperacion) {
        if (Boolean.TRUE.equals(recuperacion.getUsado()) ||
                LocalDateTime.now().isAfter(recuperacion.getFechaExpiracion())) {
            recuperacion.setUsado(true);
            recuperacionRepositorio.save(recuperacion);
            throw new IllegalArgumentException(
                    "El código expiró o ya fue utilizado. Solicita uno nuevo."
            );
        }
    }

    private void invalidarSolicitudesPendientes(Usuario usuario) {
        List<RecuperacionContrasena> solicitudes =
                recuperacionRepositorio.findByUsuarioAndUsadoFalse(usuario);

        solicitudes.forEach(solicitud -> solicitud.setUsado(true));
        recuperacionRepositorio.saveAll(solicitudes);
    }

    private boolean esMismaContrasena(String nuevaContrasena, String contrasenaActual) {
        if (contrasenaActual == null || contrasenaActual.isBlank()) {
            return false;
        }

        if (contrasenaActual.startsWith("$2a$") ||
                contrasenaActual.startsWith("$2b$") ||
                contrasenaActual.startsWith("$2y$")) {
            return passwordEncoder.matches(nuevaContrasena, contrasenaActual);
        }

        // Compatibilidad temporal con registros antiguos guardados sin hash.
        return nuevaContrasena.equals(contrasenaActual);
    }

    private String generarTokenSeguro() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

}