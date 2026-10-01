package com.lacomarcasoft.modelo;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "recuperacion_contrasena")
public class RecuperacionContrasena {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_recuperacion")
    private Long idRecuperacion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    @Column(name = "codigo_hash", nullable = false, length = 100)
    private String codigoHash;

    @Column(name = "token_hash", length = 100)
    private String tokenHash;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_expiracion", nullable = false)
    private LocalDateTime fechaExpiracion;

    @Column(name = "intentos_fallidos", nullable = false)
    private Integer intentosFallidos = 0;

    @Column(name = "codigo_verificado", nullable = false)
    private Boolean codigoVerificado = false;

    @Column(nullable = false)
    private Boolean usado = false;

    public RecuperacionContrasena() {
    }

    public Long getIdRecuperacion() {
        return idRecuperacion;
    }

    public void setIdRecuperacion(Long idRecuperacion) {
        this.idRecuperacion = idRecuperacion;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public String getCodigoHash() {
        return codigoHash;
    }

    public void setCodigoHash(String codigoHash) {
        this.codigoHash = codigoHash;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public void setTokenHash(String tokenHash) {
        this.tokenHash = tokenHash;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public LocalDateTime getFechaExpiracion() {
        return fechaExpiracion;
    }

    public void setFechaExpiracion(LocalDateTime fechaExpiracion) {
        this.fechaExpiracion = fechaExpiracion;
    }

    public Integer getIntentosFallidos() {
        return intentosFallidos;
    }

    public void setIntentosFallidos(Integer intentosFallidos) {
        this.intentosFallidos = intentosFallidos;
    }

    public Boolean getCodigoVerificado() {
        return codigoVerificado;
    }

    public void setCodigoVerificado(Boolean codigoVerificado) {
        this.codigoVerificado = codigoVerificado;
    }

    public Boolean getUsado() {
        return usado;
    }

    public void setUsado(Boolean usado) {
        this.usado = usado;
    }
}