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

    private final UsuarioRepositorio usuarioRepositorio;
    private final RecuperacionContrasenaRepositorio recuperacionRepositorio;
    private final PasswordEncoder passwordEncoder;
    private final CorreoServicio correoServicio;

    private final SecureRandom secureRandom =
            new SecureRandom();


    public RecuperacionContrasenaServicio(
            UsuarioRepositorio usuarioRepositorio,
            RecuperacionContrasenaRepositorio recuperacionRepositorio,
            PasswordEncoder passwordEncoder,
            CorreoServicio correoServicio
    ){

        this.usuarioRepositorio =
                usuarioRepositorio;

        this.recuperacionRepositorio =
                recuperacionRepositorio;

        this.passwordEncoder =
                passwordEncoder;

        this.correoServicio =
                correoServicio;
    }


    @Transactional
    public void solicitarRecuperacion(
            String correo
    ){

        Optional<Usuario> usuarioOptional =
                usuarioRepositorio.findByCorreo(
                        correo.trim()
                );


        if(usuarioOptional.isEmpty()){

            return;
        }


        Usuario usuario =
                usuarioOptional.get();


        invalidarSolicitudesPendientes(
                usuario
        );


        String codigo =
                String.format(
                        "%06d",
                        secureRandom.nextInt(
                                1000000
                        )
                );


        System.out.println(
                "CODIGO DE RECUPERACION: "
                + codigo
        );


        LocalDateTime ahora =
                LocalDateTime.now();


        RecuperacionContrasena recuperacion =
                new RecuperacionContrasena();


        recuperacion.setUsuario(
                usuario
        );

        recuperacion.setCodigoHash(
                passwordEncoder.encode(
                        codigo
                )
        );

        recuperacion.setFechaCreacion(
                ahora
        );

        recuperacion.setFechaExpiracion(
                ahora.plusMinutes(
                        MINUTOS_VIGENCIA
                )
        );

        recuperacion.setIntentosFallidos(
                0
        );

        recuperacion.setCodigoVerificado(
                false
        );

        recuperacion.setUsado(
                false
        );

        recuperacionRepositorio.save(
                recuperacion
        );

        correoServicio.enviarCodigoRecuperacion(
                usuario.getCorreo(),
                codigo
        );
    }


    @Transactional(
               noRollbackFor = IllegalArgumentException.class
        )
        public VerificarCodigoRespuesta verificarCodigo(
               VerificarCodigoSolicitud solicitud
       ){

        Usuario usuario =
                usuarioRepositorio
                        .findByCorreo(
                                solicitud.correo()
                                        .trim()
                        )
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "Usuario no encontrado"
                                        )
                        );


        RecuperacionContrasena recuperacion =
                recuperacionRepositorio
                        .findTopByUsuarioAndUsadoFalseOrderByFechaCreacionDesc(
                                usuario
                        )
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "No existe codigo activo"
                                        )
                        );


        validarVigencia(
                recuperacion
        );


        if(  recuperacion.getIntentosFallidos() >= MAX_INTENTOS){

            recuperacion.setUsado(
                    true
            );

            recuperacionRepositorio.save(
                    recuperacion
            );

            throw new IllegalArgumentException(
                "Se alcanzó el límite de intentos. Solicita un nuevo código"
            );
        }


        if(
                !passwordEncoder.matches(
                        solicitud.codigo(),
                        recuperacion.getCodigoHash()
                )
        ){

            int intentos =
                    recuperacion.getIntentosFallidos() + 1;

            recuperacion.setIntentosFallidos(
                    intentos
            );

            if(intentos >= MAX_INTENTOS){
                 recuperacion.setUsado(
                  true
                 );
            }


            recuperacionRepositorio.save(
                    recuperacion
            );

            if(intentos >= MAX_INTENTOS){

                     throw new IllegalArgumentException(
                      "Se alcanzó el límite de intentos. Solicita un nuevo código"
               );
             }

            throw new IllegalArgumentException(
                    "Codigo incorrecto"
            );
        }


        String token =
                generarToken();


        recuperacion.setCodigoVerificado(
                true
        );


        recuperacion.setTokenHash(
                passwordEncoder.encode(
                        token
                )
        );


        recuperacionRepositorio.save(
                recuperacion
        );


        return new VerificarCodigoRespuesta(
                "Codigo correcto",
                token
        );
    }


    @Transactional
    public void restablecerContrasena(
            RestablecerContrasenaSolicitud solicitud
    ){

        if(
                !solicitud
                        .nuevaContrasena()
                        .equals(
                                solicitud
                                        .confirmarContrasena()
                        )
        ){

            throw new IllegalArgumentException(
                    "Las contraseñas no coinciden"
            );
        }


        Usuario usuario =
                usuarioRepositorio
                        .findByCorreo(
                                solicitud
                                        .correo()
                                        .trim()
                        )
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "Usuario no encontrado"
                                        )
                        );


        RecuperacionContrasena recuperacion =
                recuperacionRepositorio
                        .findTopByUsuarioAndUsadoFalseOrderByFechaCreacionDesc(
                                usuario
                        )
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "Solicitud no encontrada"
                                        )
                        );


        if(
                !Boolean.TRUE.equals(
                        recuperacion
                                .getCodigoVerificado()
                )
        ){

            throw new IllegalArgumentException(
                    "Codigo no verificado"
            );
        }


        boolean tokenCorrecto =
                passwordEncoder.matches(
                        solicitud.token(),
                        recuperacion
                                .getTokenHash()
                );


        if(!tokenCorrecto){

            throw new IllegalArgumentException(
                    "Token incorrecto"
            );
        }

        if(
                usuario
                        .getContrasena()
                        .equals(
                                solicitud
                                        .nuevaContrasena()
                        )
        ){

            throw new IllegalArgumentException(
                    "La nueva contraseña debe ser diferente a la contraseña anterior"
            );
        }


        usuario.setContrasena(
                solicitud
                        .nuevaContrasena()
        );


        usuarioRepositorio.save(
                usuario
        );


        recuperacion.setUsado(
                true
        );


        recuperacionRepositorio.save(
                recuperacion
        );


        System.out.println(
                "CONTRASEÑA ACTUALIZADA CORRECTAMENTE"
        );
    }


    private void validarVigencia(
            RecuperacionContrasena recuperacion
    ){

        if(
                LocalDateTime.now()
                        .isAfter(
                                recuperacion
                                        .getFechaExpiracion()
                        )
        ){

            recuperacion.setUsado(
                    true
            );


            recuperacionRepositorio.save(
                    recuperacion
            );


            throw new IllegalArgumentException(
                    "Codigo expirado"
            );
        }
    }


    private void invalidarSolicitudesPendientes(
            Usuario usuario
    ){

        List<RecuperacionContrasena> lista =
                recuperacionRepositorio
                        .findByUsuarioAndUsadoFalse(
                                usuario
                        );


        lista.forEach(
                recuperacion ->
                        recuperacion.setUsado(
                                true
                        )
        );


        recuperacionRepositorio.saveAll(
                lista
        );
    }


    private String generarToken(){

        byte[] bytes =
                new byte[32];


        secureRandom.nextBytes(
                bytes
        );


        return Base64
                .getUrlEncoder()
                .withoutPadding()
                .encodeToString(
                        bytes
                );
    }
}