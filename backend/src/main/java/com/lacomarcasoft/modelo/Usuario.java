package com.lacomarcasoft.modelo;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name="usuario",schema="seguridad")
public class Usuario {

    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    @Column(name="id_usuario")
    private Long idUsuario;

    @ManyToOne(fetch=FetchType.EAGER)
    @JoinColumn(name="id_rol",nullable=false)
    private Rol rol;

    @Column(name="nombre",nullable=false)
    private String nombre;

    @Column(name="apellido",nullable=false)
    private String apellido;

    @Column(name="correo",nullable=false,unique=true)
    private String correo;

    @Column(name="contrasena",nullable=false)
    private String contrasena;

    @Column(name="carnet_identidad",unique=true)
    private String carnetIdentidad;

    @Column(name="celular")
    private String celular;

    @Column(name="carrera")
    private String carrera;

    @Column(name="facultad")
    private String facultad;

    @Column(name="codigo_sis",unique=true)
    private String codigoSis;

    @Column(name="activo",nullable=false)
    private Boolean activo=true;

    @Column(name="fecha_creacion",nullable=false)
    private LocalDateTime fechaCreacion;

    public Usuario(){}

    public Long getIdUsuario(){
        return idUsuario;
    }

    public void setIdUsuario(Long idUsuario){
        this.idUsuario=idUsuario;
    }

    public Rol getRol(){
        return rol;
    }

    public void setRol(Rol rol){
        this.rol=rol;
    }

    public String getNombre(){
        return nombre;
    }

    public void setNombre(String nombre){
        this.nombre=nombre;
    }

    public String getApellido(){
        return apellido;
    }

    public void setApellido(String apellido){
        this.apellido=apellido;
    }

    public String getCorreo(){
        return correo;
    }

    public void setCorreo(String correo){
        this.correo=correo;
    }

    public String getContrasena(){
        return contrasena;
    }

    public void setContrasena(String contrasena){
        this.contrasena=contrasena;
    }

    public String getCarnetIdentidad(){
        return carnetIdentidad;
    }

    public void setCarnetIdentidad(String carnetIdentidad){
        this.carnetIdentidad=carnetIdentidad;
    }

    public String getCelular(){
        return celular;
    }

    public void setCelular(String celular){
        this.celular=celular;
    }

    public String getCarrera(){
        return carrera;
    }

    public void setCarrera(String carrera){
        this.carrera=carrera;
    }

    public String getCodigoSis(){
        return codigoSis;
    }

    public void setCodigoSis(String codigoSis){
        this.codigoSis=codigoSis;
    }

    public String getFacultad(){
        return facultad;
    }

    public void setFacultad(String facultad){
        this.facultad=facultad;
    }

    public Boolean getActivo(){
        return activo;
    }

    public void setActivo(Boolean activo){
        this.activo=activo;
    }

    public LocalDateTime getFechaCreacion(){
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion){
        this.fechaCreacion=fechaCreacion;
    }
}