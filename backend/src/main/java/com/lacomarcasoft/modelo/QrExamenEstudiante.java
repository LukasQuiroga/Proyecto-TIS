package com.lacomarcasoft.modelo;

import jakarta.persistence.*;

import java.time.OffsetDateTime;

@Entity
@Table(
        name = "qr_examen_estudiante",
        schema = "academico",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_qr_examen_estudiante",
                columnNames = {"id_examen", "id_estudiante"}
        )
)
public class QrExamenEstudiante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_qr_examen")
    private Long idQrExamen;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_examen", nullable = false)
    private Examen examen;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_estudiante", nullable = false)
    private Usuario estudiante;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_materia", nullable = false)
    private Materia materia;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(name = "token_cifrado", nullable = false, columnDefinition = "TEXT")
    private String tokenCifrado;

    @Column(
            name = "fecha_creacion",
            nullable = false,
            insertable = false,
            updatable = false
    )
    private OffsetDateTime fechaCreacion;

    @Column(name = "fecha_envio")
    private OffsetDateTime fechaEnvio;

    @Column(name = "estado_envio", nullable = false, length = 20)
    private String estadoEnvio = "PENDIENTE";

    @Column(name = "intentos_envio", nullable = false)
    private Integer intentosEnvio = 0;

    @Column(name = "ultimo_error", length = 500)
    private String ultimoError;

    @Column(name = "revocado", nullable = false)
    private Boolean revocado = false;

    public Long getIdQrExamen() {
        return idQrExamen;
    }

    public Examen getExamen() {
        return examen;
    }

    public void setExamen(Examen examen) {
        this.examen = examen;
    }

    public Usuario getEstudiante() {
        return estudiante;
    }

    public void setEstudiante(Usuario estudiante) {
        this.estudiante = estudiante;
    }

    public Materia getMateria() {
        return materia;
    }

    public void setMateria(Materia materia) {
        this.materia = materia;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public void setTokenHash(String tokenHash) {
        this.tokenHash = tokenHash;
    }

    public String getTokenCifrado() {
        return tokenCifrado;
    }

    public void setTokenCifrado(String tokenCifrado) {
        this.tokenCifrado = tokenCifrado;
    }

    public OffsetDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public OffsetDateTime getFechaEnvio() {
        return fechaEnvio;
    }

    public void setFechaEnvio(OffsetDateTime fechaEnvio) {
        this.fechaEnvio = fechaEnvio;
    }

    public String getEstadoEnvio() {
        return estadoEnvio;
    }

    public void setEstadoEnvio(String estadoEnvio) {
        this.estadoEnvio = estadoEnvio;
    }

    public Integer getIntentosEnvio() {
        return intentosEnvio;
    }

    public void setIntentosEnvio(Integer intentosEnvio) {
        this.intentosEnvio = intentosEnvio;
    }

    public String getUltimoError() {
        return ultimoError;
    }

    public void setUltimoError(String ultimoError) {
        this.ultimoError = ultimoError;
    }

    public Boolean getRevocado() {
        return revocado;
    }

    public void setRevocado(Boolean revocado) {
        this.revocado = revocado;
    }
}
