package com.lacomarcasoft.dto.response;

public record LoginRespuesta(
    String token,
    UsuarioRespuesta usuario
){}