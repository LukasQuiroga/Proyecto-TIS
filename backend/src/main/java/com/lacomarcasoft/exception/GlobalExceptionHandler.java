package com.lacomarcasoft.exception;

import com.lacomarcasoft.dto.response.MensajeRespuesta;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<MensajeRespuesta> manejarNegocio(IllegalArgumentException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new MensajeRespuesta(ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<MensajeRespuesta> manejarValidacion(MethodArgumentNotValidException ex) {
        String mensaje = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .findFirst()
                .map(error -> error.getDefaultMessage())
                .orElse("Los datos enviados no son válidos.");

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new MensajeRespuesta(mensaje));
    }
}

