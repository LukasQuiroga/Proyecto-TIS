package com.lacomarcasoft.modelo;

import jakarta.persistence.*;

@Entity
@Table(name="materia",schema="academico")
public class Materia {

    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    @Column(name="id_materia")
    private Long idMateria;

    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="id_docente",nullable=false)
    private Usuario docente;

    @Column(name="nombre_materia",nullable=false)
    private String nombreMateria;

    @Column(name="grupo",nullable=false)
    private String grupo;

    public Materia(){}

    public Long getIdMateria(){
        return idMateria;
    }

    public void setIdMateria(Long idMateria){
        this.idMateria=idMateria;
    }

    public Usuario getDocente(){
        return docente;
    }

    public void setDocente(Usuario docente){
        this.docente=docente;
    }

    public String getNombreMateria(){
        return nombreMateria;
    }

    public void setNombreMateria(String nombreMateria){
        this.nombreMateria=nombreMateria;
    }

    public String getGrupo(){
        return grupo;
    }

    public void setGrupo(String grupo){
        this.grupo=grupo;
    }
}