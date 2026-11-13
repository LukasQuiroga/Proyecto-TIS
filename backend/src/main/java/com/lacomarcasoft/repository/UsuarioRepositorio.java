package com.lacomarcasoft.repository;

import com.lacomarcasoft.modelo.Usuario;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.repository.query.Param;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepositorio 
        extends JpaRepository<Usuario,Long> {


    Optional<Usuario> findByCorreo(String correo);

    Optional<Usuario> findByCarnetIdentidad(
        String carnetIdentidad
   );

Optional<Usuario> findByCodigoSis(
        String codigoSis
   );

    List<Usuario> findByCodigoSisIn(
        Collection<String> codigosSis
   );
   
    @Query("""
        SELECT u
        FROM Usuario u
        WHERE u.activo = true
        AND UPPER(u.rol.nombreRol) = 'DOCENTE'
        ORDER BY u.nombre ASC, u.apellido ASC
        """)
    List<Usuario> listarDocentesActivos();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM Usuario u WHERE u.idUsuario = :idUsuario")
    Optional<Usuario> bloquearDocente(@Param("idUsuario") Long idUsuario);
    // La fecha se fija solamente una vez: los inicios posteriores no reinician el plazo.
    @Modifying
    @Transactional
    @Query(value = """
        UPDATE seguridad.usuario
           SET fecha_primer_inicio_sesion = CURRENT_TIMESTAMP
         WHERE id_usuario = :idUsuario
           AND fecha_primer_inicio_sesion IS NULL
           AND activo = TRUE
        """, nativeQuery = true)
    int registrarPrimerInicio(@Param("idUsuario") Long idUsuario);

    @Modifying
    @Transactional
    @Query(value = """
        UPDATE seguridad.usuario
           SET activo = FALSE
         WHERE id_usuario = :idUsuario
           AND activo = TRUE
           AND (foto_perfil IS NULL OR BTRIM(foto_perfil) = '')
           AND fecha_primer_inicio_sesion IS NOT NULL
           AND fecha_primer_inicio_sesion <= CURRENT_TIMESTAMP - INTERVAL '21 days'
        """, nativeQuery = true)
    int bloquearPorFotoVencida(@Param("idUsuario") Long idUsuario);

    @Modifying
    @Transactional
    @Query(value = """
        UPDATE seguridad.usuario
           SET activo = FALSE
         WHERE activo = TRUE
           AND (foto_perfil IS NULL OR BTRIM(foto_perfil) = '')
           AND fecha_primer_inicio_sesion IS NOT NULL
           AND fecha_primer_inicio_sesion <= CURRENT_TIMESTAMP - INTERVAL '21 days'
        """, nativeQuery = true)
    int bloquearFotosVencidas();
}