package com.lacomarcasoft.modelo;

import java.io.Serializable;
import java.util.Objects;

public class AsignaturaCarreraId implements Serializable {

    private Long idAsignatura;
    private String carrera;

    public AsignaturaCarreraId() {
    }

    public AsignaturaCarreraId(Long idAsignatura, String carrera) {
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof AsignaturaCarreraId that)) return false;

        return Objects.equals(idAsignatura, that.idAsignatura)
                && Objects.equals(carrera, that.carrera);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idAsignatura, carrera);
    }
}