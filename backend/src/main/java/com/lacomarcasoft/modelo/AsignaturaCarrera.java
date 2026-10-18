package com.lacomarcasoft.modelo;

import jakarta.persistence.*;

@Entity
@Table(name = "asignatura_carrera", schema = "academico")
@IdClass(AsignaturaCarreraId.class)
public class AsignaturaCarrera {

    @Id
    @Column(name = "id_asignatura", nullable = false)
    private Long idAsignatura;

    @Id
    @Column(name = "carrera", nullable = false, length = 120)
    private String carrera;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "id_asignatura",
        referencedColumnName = "id_asignatura",
        insertable = false,
        updatable = false
    )
    private Asignatura asignatura;

    public AsignaturaCarrera() {
    }

    public AsignaturaCarrera(Long idAsignatura, String carrera) {
        this.idAsignatura = idAsignatura;
        this.carrera = carrera;
    }

    public Long getIdAsignatura() {
        return idAsignatura;
    }

    public void setIdAsignatura(Long idAsignatura) {
        this.idAsignatura = idAsignatura;
    }

    public String getCarrera() {
        return carrera;
    }

    public void setCarrera(String carrera) {
        this.carrera = carrera;
    }

    public Asignatura getAsignatura() {
        return asignatura;
    }

    public void setAsignatura(Asignatura asignatura) {
        this.asignatura = asignatura;
    }
}