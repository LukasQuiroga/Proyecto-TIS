
package com.lacomarcasoft.modelo;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class MateriaEstudianteId implements Serializable {

    private static final long serialVersionUID = 1L;

    @Column(name = "id_materia")
    private Long idMateria;

    @Column(name = "id_estudiante")
    private Long idEstudiante;

    public MateriaEstudianteId() {}

    public MateriaEstudianteId(Long idMateria, Long idEstudiante) {
        this.idMateria = idMateria;
        this.idEstudiante = idEstudiante;
    }

    public Long getIdMateria() {
        return idMateria;
    }

    public void setIdMateria(Long idMateria) {
        this.idMateria = idMateria;
    }

    public Long getIdEstudiante() {
        return idEstudiante;
    }

    public void setIdEstudiante(Long idEstudiante) {
        this.idEstudiante = idEstudiante;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) return true;

        if (!(other instanceof MateriaEstudianteId)) return false;

        MateriaEstudianteId that = (MateriaEstudianteId) other;

        return Objects.equals(idMateria, that.idMateria)
                && Objects.equals(idEstudiante, that.idEstudiante);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idMateria, idEstudiante);
    }
}
