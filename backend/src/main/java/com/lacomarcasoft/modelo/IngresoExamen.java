package com.lacomarcasoft.modelo;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(
    name = "ingreso_examen",
    schema = "academico",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_ingreso_examen_estudiante",
        columnNames = {"id_examen", "id_estudiante"}
    )
)
public class IngresoExamen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_ingreso")
    private Long idIngreso;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_examen", nullable = false)
    private Examen examen;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_estudiante", nullable = false)
    private Usuario estudiante;

    @Column(
        name = "fecha_hora_ingreso",
        nullable = false,
        insertable = false,
        updatable = false
    )
    private OffsetDateTime fechaHoraIngreso;

    @Column(name = "fecha_hora_salida")
    private OffsetDateTime fechaHoraSalida;

    @Column(name = "estado")
    private String estado;

    @Column(name = "motivo_suspension")
    private String motivoSuspension;

    @Column(name = "motivo_reincorporacion")
    private String motivoReincorporacion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_responsable", nullable = false)
    private Usuario responsable;

    public Long getIdIngreso() {
        return idIngreso;
    }

    public Examen getExamen() {
        return examen;
    }

    public Usuario getEstudiante() {
        return estudiante;
    }

    public OffsetDateTime getFechaHoraIngreso() {
        return fechaHoraIngreso;
    }

    public OffsetDateTime getFechaHoraSalida() {
        return fechaHoraSalida;
    }

    public void setFechaHoraSalida(OffsetDateTime fechaHoraSalida) {
        this.fechaHoraSalida = fechaHoraSalida;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getMotivoSuspension() {
        return motivoSuspension;
    }

    public void setMotivoSuspension(String motivoSuspension) {
        this.motivoSuspension = motivoSuspension;
    }

    public String getMotivoReincorporacion() {
        return motivoReincorporacion;
    }

    public void setMotivoReincorporacion(String motivoReincorporacion) {
        this.motivoReincorporacion = motivoReincorporacion;
    }

    public Usuario getResponsable() {
        return responsable;
    }
}
