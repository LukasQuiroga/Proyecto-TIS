package com.lacomarcasoft.exception;

import com.lacomarcasoft.dto.response.ErroresRegistroRespuesta;
import com.lacomarcasoft.dto.response.MensajeRespuesta;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

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

    @ExceptionHandler(ResponseStatusException.class)
        public ResponseEntity<MensajeRespuesta> manejarResponseStatusException(
                ResponseStatusException e
        ) {
        String mensaje = e.getReason() != null
                ? e.getReason()
                : "Error al procesar la solicitud";

        return ResponseEntity
                .status(e.getStatusCode())
                .body(new MensajeRespuesta(mensaje));
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