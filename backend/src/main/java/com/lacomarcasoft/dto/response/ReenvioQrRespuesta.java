package com.lacomarcasoft.dto.response;

public record ReenvioQrRespuesta(
        int total,
        int enviados,
        int fallidos,
        String mensaje
) {
}
