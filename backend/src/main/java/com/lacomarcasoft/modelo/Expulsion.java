
package com.lacomarcasoft.modelo;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "expulsion", schema = "academico")
public class Expulsion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_expulsion")
    private Long idExpulsion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_examen", nullable = false)
    private Examen examen;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_estudiante", nullable = false)
    private Usuario estudiante;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_responsable", nullable = false)
    private Usuario responsable;

    @Column(name = "fecha_hora_expulsion", nullable = false)
    private OffsetDateTime fechaHoraExpulsion;

    @Column(
        name = "fecha_hora_registro",
        nullable = false,
        insertable = false,
        updatable = false
    )
    private OffsetDateTime fechaHoraRegistro;

    @Column(name = "motivo", nullable = false, length = 200)
    private String motivo;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    public Expulsion() {
    }

    public Long getIdExpulsion() {
        return idExpulsion;
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

    public Usuario getResponsable() {
        return responsable;
    }

    public void setResponsable(Usuario responsable) {
        this.responsable = responsable;
    }

    public OffsetDateTime getFechaHoraExpulsion() {
        return fechaHoraExpulsion;
    }

    public void setFechaHoraExpulsion(OffsetDateTime fechaHoraExpulsion) {
        this.fechaHoraExpulsion = fechaHoraExpulsion;
    }

    public OffsetDateTime getFechaHoraRegistro() {
        return fechaHoraRegistro;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }
}
