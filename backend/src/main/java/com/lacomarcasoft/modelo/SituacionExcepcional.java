
package com.lacomarcasoft.modelo;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;

@Entity
@Table(name = "situacion_excepcional", schema = "academico")
public class SituacionExcepcional {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_situacion")
    private Long idSituacion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_examen", nullable = false)
    private Examen examen;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_estudiante")
    private Usuario estudiante;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_registrado_por", nullable = false)
    private Usuario registradoPor;

    @Column(name = "tipo_situacion", nullable = false, length = 100)
    private String tipoSituacion;

    @Column(name = "descripcion", nullable = false, columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "fecha_ocurrencia", nullable = false)
    private LocalDate fechaOcurrencia;

    @Column(name = "hora_ocurrencia", nullable = false)
    private LocalTime horaOcurrencia;

    @Column(name = "fecha_registro", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime fechaRegistro;

    @Column(name = "evidencia_referencia", length = 1000)
    private String evidenciaReferencia;

    public SituacionExcepcional() {
    }

    public Long getIdSituacion() {
        return idSituacion;
    }

    public void setIdSituacion(Long idSituacion) {
        this.idSituacion = idSituacion;
    }

    public Examen getExamen() {
        return examen;
    }

    public void setExamen(Examen examen) {
        this.examen = examen;
    }

    public Usuario getEstudiante() {
        return estudiante;
    }

    public void setEstudiante(Usuario estudiante) {
        this.estudiante = estudiante;
    }

    public Usuario getRegistradoPor() {
        return registradoPor;
    }

    public void setRegistradoPor(Usuario registradoPor) {
        this.registradoPor = registradoPor;
    }

    public String getTipoSituacion() {
        return tipoSituacion;
    }

    public void setTipoSituacion(String tipoSituacion) {
        this.tipoSituacion = tipoSituacion;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public LocalDate getFechaOcurrencia() {
        return fechaOcurrencia;
    }

    public void setFechaOcurrencia(LocalDate fechaOcurrencia) {
        this.fechaOcurrencia = fechaOcurrencia;
    }

    public LocalTime getHoraOcurrencia() {
        return horaOcurrencia;
    }

    public void setHoraOcurrencia(LocalTime horaOcurrencia) {
        this.horaOcurrencia = horaOcurrencia;
    }

    public OffsetDateTime getFechaRegistro() {
        return fechaRegistro;
    }

    public String getEvidenciaReferencia() {
        return evidenciaReferencia;
    }

    public void setEvidenciaReferencia(String evidenciaReferencia) {
        this.evidenciaReferencia = evidenciaReferencia;
    }
}
