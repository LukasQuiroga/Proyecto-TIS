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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    @Query(
        value = """
            SELECT u.*
            FROM seguridad.usuario u
            JOIN seguridad.rol r ON r.id_rol = u.id_rol
            WHERE (:nombre IS NULL OR LOWER(CONVERT_FROM(CAST(u.nombre AS bytea), 'UTF8'))
                    LIKE LOWER(CONCAT('%', CAST(:nombre AS text), '%')))
              AND (:apellido IS NULL OR LOWER(CONVERT_FROM(CAST(u.apellido AS bytea), 'UTF8'))
                    LIKE LOWER(CONCAT('%', CAST(:apellido AS text), '%')))
              AND (:ci IS NULL OR CONVERT_FROM(CAST(u.carnet_identidad AS bytea), 'UTF8')
                    LIKE CONCAT('%', CAST(:ci AS text), '%'))
              AND (:correo IS NULL OR LOWER(CONVERT_FROM(CAST(u.correo AS bytea), 'UTF8'))
                    LIKE LOWER(CONCAT('%', CAST(:correo AS text), '%')))
              AND (:rol IS NULL OR UPPER(r.nombre_rol) = UPPER(CAST(:rol AS text)))
              AND (:activo IS NULL OR u.activo = :activo)
            ORDER BY u.apellido ASC, u.nombre ASC, u.id_usuario ASC
            """,
        countQuery = """
            SELECT COUNT(*)
            FROM seguridad.usuario u
            JOIN seguridad.rol r ON r.id_rol = u.id_rol
            WHERE (:nombre IS NULL OR LOWER(CONVERT_FROM(CAST(u.nombre AS bytea), 'UTF8'))
                    LIKE LOWER(CONCAT('%', CAST(:nombre AS text), '%')))
              AND (:apellido IS NULL OR LOWER(CONVERT_FROM(CAST(u.apellido AS bytea), 'UTF8'))
                    LIKE LOWER(CONCAT('%', CAST(:apellido AS text), '%')))
              AND (:ci IS NULL OR CONVERT_FROM(CAST(u.carnet_identidad AS bytea), 'UTF8')
                    LIKE CONCAT('%', CAST(:ci AS text), '%'))
              AND (:correo IS NULL OR LOWER(CONVERT_FROM(CAST(u.correo AS bytea), 'UTF8'))
                    LIKE LOWER(CONCAT('%', CAST(:correo AS text), '%')))
              AND (:rol IS NULL OR UPPER(r.nombre_rol) = UPPER(CAST(:rol AS text)))
              AND (:activo IS NULL OR u.activo = :activo)
            """,
        nativeQuery = true
    )
    Page<Usuario> buscarPaginado(
        @Param("nombre") String nombre,
        @Param("apellido") String apellido,
        @Param("ci") String ci,
        @Param("correo") String correo,
        @Param("rol") String rol,
        @Param("activo") Boolean activo,
        Pageable pageable
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
