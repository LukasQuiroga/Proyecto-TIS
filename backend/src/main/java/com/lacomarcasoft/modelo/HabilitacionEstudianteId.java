
package com.lacomarcasoft.modelo;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class HabilitacionEstudianteId implements Serializable {
    private static final long serialVersionUID = 1L;

    @Column(name = "id_examen")
    private Long idExamen;

    @Column(name = "id_estudiante")
    private Long idEstudiante;

    public HabilitacionEstudianteId() {}

    public HabilitacionEstudianteId(Long idExamen, Long idEstudiante) {
        this.idExamen = idExamen;
        this.idEstudiante = idEstudiante;
    }

    public Long getIdExamen() { return idExamen; }
    public void setIdExamen(Long idExamen) { this.idExamen = idExamen; }

    public Long getIdEstudiante() { return idEstudiante; }
    public void setIdEstudiante(Long idEstudiante) { this.idEstudiante = idEstudiante; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof HabilitacionEstudianteId that)) return false;
        return Objects.equals(idExamen, that.idExamen)
            && Objects.equals(idEstudiante, that.idEstudiante);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idExamen, idEstudiante);
    }
}