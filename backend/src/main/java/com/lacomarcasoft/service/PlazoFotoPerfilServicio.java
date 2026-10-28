package com.lacomarcasoft.service;

import com.lacomarcasoft.repository.UsuarioRepositorio;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class PlazoFotoPerfilServicio {
    private final UsuarioRepositorio usuarios;

    public PlazoFotoPerfilServicio(UsuarioRepositorio usuarios) {
        this.usuarios = usuarios;
    }

    public void registrarPrimerInicioYVerificar(Long idUsuario) {
        usuarios.registrarPrimerInicio(idUsuario);
        if (usuarios.bloquearPorFotoVencida(idUsuario) > 0) {
            throw new IllegalStateException(
                "Cuenta bloqueada: vencieron los 21 días para registrar la foto de perfil. Contacte al administrador."
            );
        }
    }

    public boolean bloquearSiVencio(Long idUsuario) {
        return usuarios.bloquearPorFotoVencida(idUsuario) > 0;
    }

    @Scheduled(fixedDelayString = "${app.foto-perfil.intervalo-bloqueo-ms:3600000}")
    public void bloquearCuentasVencidas() {
        usuarios.bloquearFotosVencidas();
    }
}
