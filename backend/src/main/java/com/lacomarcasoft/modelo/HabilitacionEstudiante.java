
package com.lacomarcasoft.modelo;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "habilitacion_estudiante", schema = "academico")
public class HabilitacionEstudiante {
    @EmbeddedId
    private HabilitacionEstudianteId id;

    @MapsId("idExamen")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_examen")
    private Examen examen;

    @MapsId("idEstudiante")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_estudiante")
    private Usuario estudiante;

    @Column(name = "estado", nullable = false, length = 20)
    private String estado = "HABILITADO";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_motivo")
    private MotivoInhabilitacion motivo;

    @Column(name = "fecha_creacion", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion", nullable = false)
    private OffsetDateTime fechaActualizacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario_responsable")
    private Usuario usuarioResponsable;

    @Column(name = "numero_cambios", nullable = false)
    private Long numeroCambios = 0L;

    public HabilitacionEstudiante() {}

    @PrePersist
    @PreUpdate
    private void actualizarFecha() {
        fechaActualizacion = OffsetDateTime.now();
    }

    public HabilitacionEstudianteId getId() { return id; }
    public void setId(HabilitacionEstudianteId id) { this.id = id; }

    public Examen getExamen() { return examen; }
    public void setExamen(Examen examen) { this.examen = examen; }

    public Usuario getEstudiante() { return estudiante; }
    public void setEstudiante(Usuario estudiante) { this.estudiante = estudiante; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public MotivoInhabilitacion getMotivo() { return motivo; }
    public void setMotivo(MotivoInhabilitacion motivo) { this.motivo = motivo; }

    public OffsetDateTime getFechaCreacion() { return fechaCreacion; }
    public OffsetDateTime getFechaActualizacion() { return fechaActualizacion; }

    public Usuario getUsuarioResponsable() { return usuarioResponsable; }
    public void setUsuarioResponsable(Usuario usuarioResponsable) {
        this.usuarioResponsable = usuarioResponsable;
    }

    public Long getNumeroCambios() { return numeroCambios; }
    public void setNumeroCambios(Long numeroCambios) { this.numeroCambios = numeroCambios; }
}