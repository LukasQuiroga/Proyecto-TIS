package com.lacomarcasoft.controller;

import com.lacomarcasoft.dto.request.LoginRequest;
import com.lacomarcasoft.dto.response.LoginRespuesta;
import com.lacomarcasoft.service.AuditoriaAccionesServicio;
import com.lacomarcasoft.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins="*")
public class AuthController {

    private final AuthService authService;
    private final AuditoriaAccionesServicio auditoria;

    public AuthController(
        AuthService authService,
        AuditoriaAccionesServicio auditoria
    ){
        this.authService=authService;
        this.auditoria=auditoria;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
        @RequestBody LoginRequest request,
        HttpServletRequest httpRequest
    ){

        try{

            LoginRespuesta respuesta=
                authService.login(request);

            auditoria.registrar(
                respuesta.usuario().idUsuario(),
                httpRequest,
                "INICIAR_SESION",
                "Inicio de sesión en el sistema",
                true
            );

            return ResponseEntity.ok(respuesta);

        }catch(Exception e){

            auditoria.registrar(
                (Long) null,
                httpRequest,
                "INICIAR_SESION",
                "Intento de inicio de sesión fallido"
                    + (request != null && request.correo() != null
                        ? " para " + request.correo()
                        : ""),
                false
            );

            return ResponseEntity
                .badRequest()
                .body(e.getMessage());
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(
        @RequestHeader(
            value="Authorization",
            required=false
        )
        String authorization,
        Authentication authentication,
        HttpServletRequest httpRequest
    ){

        try{

            if(
                authorization!=null &&
                authorization.startsWith("Bearer ")
            ){

                String token=
                    authorization.substring(7);

                authService.logout(token);

                auditoria.registrar(
                    authentication,
                    httpRequest,
                    "CERRAR_SESION",
                    "Cierre de sesión en el sistema"
                );
            }

            return ResponseEntity.ok().build();

        }catch(Exception e){

            auditoria.registrarFallo(
                authentication,
                httpRequest,
                "CERRAR_SESION",
                "No se pudo cerrar la sesión"
            );

            return ResponseEntity.ok().build();
        }
    }

    @GetMapping("/{idUsuario}/permisos")
    public ResponseEntity<List<String>> obtenerPermisosActuales(
        @PathVariable Long idUsuario
    ){

        return ResponseEntity.ok(
            authService.obtenerPermisosActuales(idUsuario)
        );
    }
}