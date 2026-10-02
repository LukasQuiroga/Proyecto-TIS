package com.lacomarcasoft.exception;

import com.lacomarcasoft.dto.response.ErroresRegistroRespuesta;
import com.lacomarcasoft.dto.response.MensajeRespuesta;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ManejadorErroresGlobal {

    @ExceptionHandler(ValidacionRegistroException.class)
    public ResponseEntity<ErroresRegistroRespuesta> manejarValidacionRegistro(
            ValidacionRegistroException e
    ){

        return ResponseEntity
                .badRequest()
                .body(
                        new ErroresRegistroRespuesta(
                                e.getErrores()
                        )
                );

    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<MensajeRespuesta> manejarRuntimeException(
            RuntimeException e
    ){

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(
                        new MensajeRespuesta(
                                e.getMessage()
                        )
                );

    }

}