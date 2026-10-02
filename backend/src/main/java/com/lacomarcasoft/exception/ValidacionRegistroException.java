package com.lacomarcasoft.exception;

import com.lacomarcasoft.dto.response.CampoError;

import java.util.List;

public class ValidacionRegistroException extends RuntimeException {

    private final List<CampoError> errores;

    public ValidacionRegistroException(
            List<CampoError> errores
    ){
        super("Error de validación del registro");
        this.errores = errores;
    }

    public List<CampoError> getErrores() {
        return errores;
    }

}