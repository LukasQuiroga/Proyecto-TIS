package com.lacomarcasoft.controller;

import com.lacomarcasoft.dto.request.LoginRequest;
import com.lacomarcasoft.dto.response.LoginRespuesta;
import com.lacomarcasoft.service.AuthService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {


    private final AuthService authService;


    public AuthController(
            AuthService authService
    ){
        this.authService = authService;
    }


    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest request
    ){

        try{

            LoginRespuesta respuesta =
                    authService.login(request);


            return ResponseEntity.ok(
                    respuesta
            );


        }catch(Exception e){

            return ResponseEntity
                    .badRequest()
                    .body(
                            e.getMessage()
                    );

        }

    }

}