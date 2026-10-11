
package com.lacomarcasoft.modelo;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "materia_estudiante", schema = "academico")
public class MateriaEstudiante {

    @EmbeddedId
    private MateriaEstudianteId id;

    @MapsId("idMateria")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_materia", nullable = false)
    private Materia materia;

    @MapsId("idEstudiante")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_estudiante", nullable = false)
    private Usuario estudiante;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_qr", nullable = false)
    private QrInscripcion qrInscripcion;

    @Column(name = "fecha_inscripcion", nullable = false,
            insertable = false, updatable = false)
    private OffsetDateTime fechaInscripcion;

    public MateriaEstudiante() {}

    public MateriaEstudianteId getId() {
        return id;
    }

    public void setId(MateriaEstudianteId id) {
        this.id = id;
    }

    public Materia getMateria() {
        return materia;
    }

    public void setMateria(Materia materia) {
        this.materia = materia;
    }

    public Usuario getEstudiante() {
        return estudiante;
    }

    public void setEstudiante(Usuario estudiante) {
        this.estudiante = estudiante;
    }

    public QrInscripcion getQrInscripcion() {
        return qrInscripcion;
    }

    public void setQrInscripcion(QrInscripcion qrInscripcion) {
        this.qrInscripcion = qrInscripcion;
    }

    public OffsetDateTime getFechaInscripcion() {
        return fechaInscripcion;
    }
}
