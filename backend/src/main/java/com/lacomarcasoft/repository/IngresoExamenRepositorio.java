package com.lacomarcasoft.repository;

import com.lacomarcasoft.modelo.IngresoExamen;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface IngresoExamenRepositorio
        extends JpaRepository<IngresoExamen, Long> {

    boolean existsByExamen_IdExamenAndEstudiante_IdUsuario(
        Long idExamen,
        Long idEstudiante
    );

    Optional<IngresoExamen> findByExamen_IdExamenAndEstudiante_IdUsuario(
        Long idExamen,
        Long idEstudiante
    );
}
