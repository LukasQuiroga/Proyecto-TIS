
package com.lacomarcasoft.repository;

import com.lacomarcasoft.modelo.Expulsion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExpulsionRepositorio extends JpaRepository<Expulsion, Long> {

    boolean existsByExamen_IdExamenAndEstudiante_IdUsuario(
            Long idExamen,
            Long idEstudiante
    );

    Optional<Expulsion> findByExamen_IdExamenAndEstudiante_IdUsuario(
            Long idExamen,
            Long idEstudiante
    );

    List<Expulsion> findByExamen_IdExamenOrderByFechaHoraExpulsionDesc(
            Long idExamen
    );
}
