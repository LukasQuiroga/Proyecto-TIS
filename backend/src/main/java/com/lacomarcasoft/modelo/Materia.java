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

    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="id_asignatura",nullable=false)
    private Asignatura asignatura;

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

    public Asignatura getAsignatura(){
        return asignatura;
    }

    public void setAsignatura(Asignatura asignatura){
        this.asignatura=asignatura;
    }

    public String getGrupo(){
        return grupo;
    }

    public void setGrupo(String grupo){
        this.grupo=grupo;
    }
}