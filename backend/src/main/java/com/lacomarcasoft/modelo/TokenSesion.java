package com.lacomarcasoft.modelo;

import jakarta.persistence.*;

import java.time.OffsetDateTime;

@Entity
@Table(
    name="token_sesion",
    schema="seguridad"
)
public class TokenSesion {

    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    @Column(name="id_token")
    private Long idToken;

    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(
        name="id_usuario",
        nullable=false
    )
    private Usuario usuario;

    @Column(
        name="token_id",
        nullable=false,
        unique=true,
        length=100
    )
    private String tokenId;

    @Column(
        name="activa",
        nullable=false
    )
    private Boolean activa=true;

    @Column(
        name="fecha_creacion",
        nullable=false
    )
    private OffsetDateTime fechaCreacion;

    public TokenSesion(){}

    @PrePersist
    public void prePersist(){
        if(fechaCreacion==null){
            fechaCreacion=OffsetDateTime.now();
        }
    }

    public Long getIdToken(){
        return idToken;
    }

    public void setIdToken(Long idToken){
        this.idToken=idToken;
    }

    public Usuario getUsuario(){
        return usuario;
    }

    public void setUsuario(Usuario usuario){
        this.usuario=usuario;
    }

    public String getTokenId(){
        return tokenId;
    }

    public void setTokenId(String tokenId){
        this.tokenId=tokenId;
    }

    public Boolean getActiva(){
        return activa;
    }

    public void setActiva(Boolean activa){
        this.activa=activa;
    }

    public OffsetDateTime getFechaCreacion(){
        return fechaCreacion;
    }

    public void setFechaCreacion(
        OffsetDateTime fechaCreacion
    ){
        this.fechaCreacion=fechaCreacion;
    }
}