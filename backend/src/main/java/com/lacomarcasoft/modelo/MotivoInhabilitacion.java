
package com.lacomarcasoft.modelo;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "motivo_inhabilitacion", schema = "academico")
public class MotivoInhabilitacion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_motivo")
    private Long idMotivo;

    @Column(name = "titulo", nullable = false, length = 120)
    private String titulo;

    @Column(name = "motivo", nullable = false, length = 500)
    private String motivo;

    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

    @Column(name = "fecha_creacion", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime fechaCreacion;

    public MotivoInhabilitacion() {}

    public Long getIdMotivo() { return idMotivo; }
    public void setIdMotivo(Long idMotivo) { this.idMotivo = idMotivo; }

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }

    public OffsetDateTime getFechaCreacion() { return fechaCreacion; }
}