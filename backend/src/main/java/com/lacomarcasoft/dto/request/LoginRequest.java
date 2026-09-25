package com.lacomarcasoft.dto.request;

public record LoginRequest(
        String correo,
        String password
) {
}