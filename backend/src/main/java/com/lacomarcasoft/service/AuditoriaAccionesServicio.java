package com.lacomarcasoft.service;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
public class AuditoriaAccionesServicio {

    private static final Logger LOG =
            LoggerFactory.getLogger(AuditoriaAccionesServicio.class);

    private final LogActividadServicio logActividadServicio;

    public AuditoriaAccionesServicio(
            LogActividadServicio logActividadServicio
    ) {
        this.logActividadServicio = logActividadServicio;
    }

    public void registrar(
            Authentication authentication,
            HttpServletRequest request,
            String tipoAccion,
            String descripcion
    ) {
        registrar(
                authentication,
                request,
                tipoAccion,
                descripcion,
                true
        );
    }

    public void registrar(
            Authentication authentication,
            HttpServletRequest request,
            String tipoAccion,
            String descripcion,
            boolean exitosa
    ) {
        registrar(
                obtenerIdUsuario(authentication),
                obtenerIp(request),
                tipoAccion,
                descripcion,
                exitosa
        );
    }

    public void registrar(
            Long idUsuario,
            HttpServletRequest request,
            String tipoAccion,
            String descripcion,
            boolean exitosa
    ) {
        registrar(
                idUsuario,
                obtenerIp(request),
                tipoAccion,
                descripcion,
                exitosa
        );
    }

    public void registrar(
            Long idUsuario,
            String ipOrigen,
            String tipoAccion,
            String descripcion,
            boolean exitosa
    ) {
        try {
            logActividadServicio.registrar(
                    idUsuario,
                    tipoAccion,
                    descripcion,
                    ipOrigen,
                    exitosa
            );
        } catch (Exception ex) {
            LOG.warn(
                    "No se pudo registrar la auditoría de la acción {}: {}",
                    tipoAccion,
                    ex.getMessage()
            );
        }
    }

    public void registrarFallo(
            Authentication authentication,
            HttpServletRequest request,
            String tipoAccion,
            String descripcion
    ) {
        registrar(
                authentication,
                request,
                tipoAccion,
                descripcion,
                false
        );
    }

    public void registrarFallo(
            Long idUsuario,
            HttpServletRequest request,
            String tipoAccion,
            String descripcion
    ) {
        registrar(
                idUsuario,
                request,
                tipoAccion,
                descripcion,
                false
        );
    }

    private Long obtenerIdUsuario(Authentication authentication) {
        if (authentication != null
                && authentication.getDetails() instanceof Long idUsuario) {
            return idUsuario;
        }

        return null;
    }

    private String obtenerIp(HttpServletRequest request) {
        if (request == null) {
            return null;
        }

        String ip = request.getHeader("X-Forwarded-For");

        if (ip != null && !ip.isBlank()) {
            return ip.split(",")[0].trim();
        }

        return request.getRemoteAddr();
    }
}
