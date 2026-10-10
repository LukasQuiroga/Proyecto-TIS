package com.lacomarcasoft.modelo;

import jakarta.persistence.*;

@Entity
@Table(name = "asignatura", schema = "academico")
public class Asignatura {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_asignatura")
    private Long idAsignatura;

    @Column(name = "codigo_asignatura", nullable = false, length = 30)
    private String codigoAsignatura;

    @Column(name = "nombre_asignatura", nullable = false, length = 120)
    private String nombreAsignatura;

    @Column(name = "semestre", nullable = false)
    private Short semestre;

    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

    @Column(name = "descripcion")
    private String descripcion;

    public Asignatura() {
    }

    public Long getIdAsignatura() {
        return idAsignatura;
    }

    public void setIdAsignatura(Long idAsignatura) {
        this.idAsignatura = idAsignatura;
    }

    public String getCodigoAsignatura() {
        return codigoAsignatura;
    }

    public void setCodigoAsignatura(String codigoAsignatura) {
        this.codigoAsignatura = codigoAsignatura;
    }

    public String getNombreAsignatura() {
        return nombreAsignatura;
    }

    public void setNombreAsignatura(String nombreAsignatura) {
        this.nombreAsignatura = nombreAsignatura;
    }

    public Short getSemestre() {
        return semestre;
    }

    public void setSemestre(Short semestre) {
        this.semestre = semestre;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }
}