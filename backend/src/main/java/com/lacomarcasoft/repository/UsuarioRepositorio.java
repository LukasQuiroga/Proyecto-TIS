package com.lacomarcasoft.repository;

import com.lacomarcasoft.modelo.Usuario;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
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
}