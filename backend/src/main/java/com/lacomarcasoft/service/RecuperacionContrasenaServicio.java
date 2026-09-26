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

    private final SecureRandom secureRandom = new SecureRandom();


    public RecuperacionContrasenaServicio(
            UsuarioRepositorio usuarioRepositorio,
            RecuperacionContrasenaRepositorio recuperacionRepositorio,
            PasswordEncoder passwordEncoder,
            CorreoServicio correoServicio
    ){

        this.usuarioRepositorio = usuarioRepositorio;
        this.recuperacionRepositorio = recuperacionRepositorio;
        this.passwordEncoder = passwordEncoder;
        this.correoServicio = correoServicio;

    }



    @Transactional
    public void solicitarRecuperacion(String correo){


        System.out.println("==============================");
        System.out.println("Correo recibido: [" + correo + "]");


        Optional<Usuario> usuarioOptional =
                usuarioRepositorio.findByCorreo(
                        correo.trim()
                );


        System.out.println(
                "Usuario encontrado: "
                + usuarioOptional.isPresent()
        );


        if(usuarioOptional.isEmpty()){

            System.out.println(
                    "Correo no encontrado"
            );

            return;
        }


        Usuario usuario = usuarioOptional.get();


        invalidarSolicitudesPendientes(usuario);



        String codigo =
                String.format(
                        "%06d",
                        secureRandom.nextInt(1000000)
                );



        System.out.println("==============================");
        System.out.println("CODIGO DE RECUPERACION");
        System.out.println(
                "Usuario: "
                + usuario.getCorreo()
        );
        System.out.println(
                "Codigo: "
                + codigo
        );
        System.out.println("==============================");



        LocalDateTime ahora =
                LocalDateTime.now();



        RecuperacionContrasena recuperacion =
                new RecuperacionContrasena();


        recuperacion.setUsuario(usuario);

        recuperacion.setCodigoHash(
                passwordEncoder.encode(codigo)
        );

        recuperacion.setFechaCreacion(
                ahora
        );

        recuperacion.setFechaExpiracion(
                ahora.plusMinutes(MINUTOS_VIGENCIA)
        );

        recuperacion.setIntentosFallidos(0);

        recuperacion.setCodigoVerificado(false);

        recuperacion.setUsado(false);


        recuperacionRepositorio.save(
                recuperacion
        );
        
        correoServicio.enviarCodigoRecuperacion(
        usuario.getCorreo(),
        codigo
);

    }




    @Transactional
    public VerificarCodigoRespuesta verificarCodigo(
            VerificarCodigoSolicitud solicitud
    ){


        Usuario usuario =
                usuarioRepositorio.findByCorreo(
                        solicitud.correo().trim()
                )
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Usuario no encontrado"
                        )
                );



        RecuperacionContrasena recuperacion =
                recuperacionRepositorio
                .findTopByUsuarioAndUsadoFalseOrderByFechaCreacionDesc(usuario)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "No existe codigo activo"
                        )
                );



        validarVigencia(recuperacion);



        if(recuperacion.getIntentosFallidos() >= MAX_INTENTOS){

            recuperacion.setUsado(true);

            recuperacionRepositorio.save(
                    recuperacion
            );

            throw new IllegalArgumentException(
                    "Maximo de intentos alcanzado"
            );
        }




        if(!passwordEncoder.matches(
                solicitud.codigo(),
                recuperacion.getCodigoHash()
        )){


            int intentos =
                    recuperacion.getIntentosFallidos()+1;


            recuperacion.setIntentosFallidos(
                    intentos
            );


            recuperacionRepositorio.save(
                    recuperacion
            );


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
                passwordEncoder.encode(token)
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


        System.out.println("==============================");
        System.out.println("RESTABLECER CONTRASEÑA");
        System.out.println(
                "Correo: "
                + solicitud.correo()
        );
        System.out.println(
                "Token recibido: "
                + solicitud.token()
        );
        System.out.println(
                "Nueva contraseña: "
                + solicitud.nuevaContrasena()
        );
        System.out.println("==============================");



        if(!solicitud.nuevaContrasena()
                .equals(
                        solicitud.confirmarContrasena()
                )){


            System.out.println(
                    "ERROR: Contraseñas no coinciden"
            );


            throw new IllegalArgumentException(
                    "Las contraseñas no coinciden"
            );

        }




        Usuario usuario =
                usuarioRepositorio.findByCorreo(
                        solicitud.correo().trim()
                )
                .orElseThrow(() -> {

                    System.out.println(
                            "ERROR: Usuario no encontrado"
                    );

                    return new IllegalArgumentException(
                            "Usuario no encontrado"
                    );

                });




        RecuperacionContrasena recuperacion =
                recuperacionRepositorio
                .findTopByUsuarioAndUsadoFalseOrderByFechaCreacionDesc(usuario)
                .orElseThrow(() -> {


                    System.out.println(
                            "ERROR: Solicitud no encontrada"
                    );


                    return new IllegalArgumentException(
                            "Solicitud no encontrada"
                    );

                });




        System.out.println(
                "Codigo verificado: "
                + recuperacion.getCodigoVerificado()
        );



        if(!Boolean.TRUE.equals(
                recuperacion.getCodigoVerificado()
        )){


            throw new IllegalArgumentException(
                    "Codigo no verificado"
            );

        }





        boolean tokenCorrecto =
                passwordEncoder.matches(
                        solicitud.token(),
                        recuperacion.getTokenHash()
                );



        System.out.println(
                "Token correcto: "
                + tokenCorrecto
        );



        if(!tokenCorrecto){


            throw new IllegalArgumentException(
                    "Token incorrecto"
            );

        }




        usuario.setContrasena(
                passwordEncoder.encode(
                        solicitud.nuevaContrasena()
                )
        );


        usuarioRepositorio.save(
                usuario
        );



        recuperacion.setUsado(true);


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


        if(LocalDateTime.now()
                .isAfter(
                        recuperacion.getFechaExpiracion()
                )){


            recuperacion.setUsado(true);


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
                .findByUsuarioAndUsadoFalse(usuario);



        lista.forEach(
                r -> r.setUsado(true)
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


        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);

    }

}