
package com.lacomarcasoft.service;

import com.lacomarcasoft.modelo.SituacionExcepcional;
import com.lacomarcasoft.repository.SituacionExcepcionalRepositorio;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SituacionExcepcionalEvidenciaServicio {

    private final SituacionExcepcionalRepositorio repositorio;
    private final AlmacenamientoEvidenciaServicio almacenamiento;

    public SituacionExcepcionalEvidenciaServicio(
            SituacionExcepcionalRepositorio repositorio,
            AlmacenamientoEvidenciaServicio almacenamiento
    ) {
        this.repositorio = repositorio;
        this.almacenamiento = almacenamiento;
    }

    @Transactional
    public void adjuntar(Long idSituacion, MultipartFile archivo) {
        validarAdministrador();
        validarIdentificador(idSituacion);

        if (archivo == null || archivo.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Debe seleccionar un archivo de evidencia"
            );
        }

        SituacionExcepcional situacion = repositorio
                .bloquearParaAdjuntar(idSituacion)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Situacion excepcional no encontrada"
                ));

        if (situacion.getEvidenciaReferencia() != null
                && !situacion.getEvidenciaReferencia().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "La situacion ya tiene una evidencia adjunta"
            );
        }

        String referencia = almacenamiento.guardar(
                idSituacion,
                archivo
        );

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(
                    new TransactionSynchronization() {
                        @Override
                        public void afterCompletion(int estado) {
                            if (estado != STATUS_COMMITTED) {
                                almacenamiento.eliminar(referencia);
                            }
                        }
                    }
            );
        }

        try {
            situacion.setEvidenciaReferencia(referencia);
            repositorio.saveAndFlush(situacion);
        } catch (RuntimeException ex) {
            if (!TransactionSynchronizationManager.isSynchronizationActive()) {
                almacenamiento.eliminar(referencia);
            }

            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "No se pudo asociar la evidencia a la situacion",
                    ex
            );
        }
    }

    @Transactional(readOnly = true)
    public AlmacenamientoEvidenciaServicio.Archivo descargar(
            Long idSituacion
    ) {
        validarAdministrador();
        validarIdentificador(idSituacion);

        SituacionExcepcional situacion = repositorio
                .findById(idSituacion)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Situacion excepcional no encontrada"
                ));

        String referencia = situacion.getEvidenciaReferencia();

        if (referencia == null || referencia.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "La situacion no tiene evidencia adjunta"
            );
        }

        return almacenamiento.consultar(idSituacion, referencia);
    }

    private void validarIdentificador(Long idSituacion) {
        if (idSituacion == null || idSituacion <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Identificador de situacion invalido"
            );
        }
    }

    private void validarAdministrador() {
        Authentication autenticacion = SecurityContextHolder
                .getContext()
                .getAuthentication();

        if (autenticacion == null
                || !autenticacion.isAuthenticated()
                || !(autenticacion.getDetails() instanceof Long)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Debe iniciar sesion"
            );
        }

        boolean administrador = autenticacion.getAuthorities()
                .stream()
                .anyMatch(autoridad ->
                        "ROLE_ADMINISTRADOR".equals(
                                autoridad.getAuthority()
                        )
                );

        if (!administrador) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "No tiene permisos para gestionar evidencias"
            );
        }
    }
}
