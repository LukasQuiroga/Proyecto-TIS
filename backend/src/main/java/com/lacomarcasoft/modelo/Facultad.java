package com.lacomarcasoft.modelo;

import jakarta.persistence.*;

@Entity
@Table(name="facultad",schema="academico")
public class Facultad {

    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    @Column(name="id_facultad")
    private Long idFacultad;

    @Column(name="codigo",nullable=false,unique=true)
    private String codigo;

    @Column(name="nombre",nullable=false,unique=true)
    private String nombre;

    public Facultad(){}

    public Long getIdFacultad(){
        return idFacultad;
    }

    public void setIdFacultad(Long idFacultad){
        this.idFacultad=idFacultad;
    }

    public String getCodigo(){
        return codigo;
    }

    public void setCodigo(String codigo){
        this.codigo=codigo;
    }

    public String getNombre(){
        return nombre;
    }

    public void setNombre(String nombre){
        this.nombre=nombre;
    }
}
