package com.lacomarcasoft.modelo;

import jakarta.persistence.*;

import java.util.List;

@Entity
@Table(name = "permiso")
public class Permiso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_permiso")
    private Long idPermiso;

    @Column(nullable = false, unique = true)
    private String nombrePermiso;

    private String descripcion;

    @ManyToMany(mappedBy = "permisos")
    private List<Rol> roles;


    public Permiso() {
    }


    public Long getIdPermiso() {
        return idPermiso;
    }

    public void setIdPermiso(Long idPermiso) {
        this.idPermiso = idPermiso;
    }


    public String getNombrePermiso() {
        return nombrePermiso;
    }

    public void setNombrePermiso(String nombrePermiso) {
        this.nombrePermiso = nombrePermiso;
    }


    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }


    public List<Rol> getRoles() {
        return roles;
    }

    public void setRoles(List<Rol> roles) {
        this.roles = roles;
    }
}
