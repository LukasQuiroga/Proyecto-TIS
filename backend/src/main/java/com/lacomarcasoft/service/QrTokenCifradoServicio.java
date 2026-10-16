
package com.lacomarcasoft.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class QrTokenCifradoServicio {

    private static final int IV_BYTES = 12;
    private static final int TAG_BITS = 128;

    private final SecureRandom random = new SecureRandom();
    private final SecretKeySpec clave;

    public QrTokenCifradoServicio(
            @Value("${qr.encryption-key}") String claveBase64
    ) {
        byte[] bytes;

        try {
            bytes = Base64.getDecoder().decode(claveBase64);
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException(
                    "La clave de cifrado QR no es Base64 valido", e
            );
        }

        if (bytes.length != 32) {
            throw new IllegalStateException(
                    "La clave de cifrado QR debe tener 32 bytes"
            );
        }

        this.clave = new SecretKeySpec(bytes, "AES");
    }

    public String cifrar(String token) {
        try {
            byte[] iv = new byte[IV_BYTES];
            random.nextBytes(iv);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(
                    Cipher.ENCRYPT_MODE,
                    clave,
                    new GCMParameterSpec(TAG_BITS, iv)
            );

            byte[] cifrado = cipher.doFinal(
                    token.getBytes(StandardCharsets.UTF_8)
            );

            byte[] resultado = new byte[iv.length + cifrado.length];
            System.arraycopy(iv, 0, resultado, 0, iv.length);
            System.arraycopy(
                    cifrado, 0, resultado, iv.length, cifrado.length
            );

            return Base64.getEncoder().encodeToString(resultado);

        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(
                    "No se pudo cifrar el token QR", e
            );
        }
    }

    public String descifrar(String tokenCifrado) {
        try {
            byte[] datos = Base64.getDecoder().decode(tokenCifrado);

            if (datos.length <= IV_BYTES + 16) {
                throw new IllegalStateException(
                        "El token cifrado no tiene un formato valido"
                );
            }

            byte[] iv = new byte[IV_BYTES];
            System.arraycopy(datos, 0, iv, 0, IV_BYTES);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(
                    Cipher.DECRYPT_MODE,
                    clave,
                    new GCMParameterSpec(TAG_BITS, iv)
            );

            byte[] plano = cipher.doFinal(
                    datos, IV_BYTES, datos.length - IV_BYTES
            );

            return new String(plano, StandardCharsets.UTF_8);

        } catch (GeneralSecurityException | IllegalArgumentException e) {
            throw new IllegalStateException(
                    "No se pudo recuperar el token QR", e
            );
        }
    }
}
