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

    public Usuario getResponsable() {
        return responsable;
    }
}
