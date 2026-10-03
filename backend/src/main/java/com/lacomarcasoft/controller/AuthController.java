package com.lacomarcasoft.controller;

import com.lacomarcasoft.dto.request.LoginRequest;
import com.lacomarcasoft.dto.response.LoginRespuesta;
import com.lacomarcasoft.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins="*")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService){
        this.authService=authService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
        @RequestBody LoginRequest request
    ){

        try{

            LoginRespuesta respuesta=
                authService.login(request);

            return ResponseEntity.ok(respuesta);

        }catch(Exception e){

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
        String authorization
    ){

        try{

            if(
                authorization!=null &&
                authorization.startsWith("Bearer ")
            ){

                String token=
                    authorization.substring(7);

                authService.logout(token);
            }

            return ResponseEntity.ok().build();

        }catch(Exception e){

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