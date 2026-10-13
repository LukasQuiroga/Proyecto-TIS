package com.lacomarcasoft.modelo;

import jakarta.persistence.*;

@Entity
@Table(name="carrera",schema="academico")
public class Carrera {

    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    @Column(name="id_carrera")
    private Long idCarrera;

    @Column(name="nombre",nullable=false,unique=true)
    private String nombre;

    @ManyToOne(fetch=FetchType.EAGER)
    @JoinColumn(name="id_facultad",nullable=false)
    private Facultad facultad;

    public Carrera(){}

    public Long getIdCarrera(){
        return idCarrera;
    }

    public void setIdCarrera(Long idCarrera){
        this.idCarrera=idCarrera;
    }

    public String getNombre(){
        return nombre;
    }

    public void setNombre(String nombre){
        this.nombre=nombre;
    }

    public Facultad getFacultad(){
        return facultad;
    }

    public void setFacultad(Facultad facultad){
        this.facultad=facultad;
    }
}
