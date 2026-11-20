
package com.lacomarcasoft.repository;

import com.lacomarcasoft.modelo.SituacionExcepcional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SituacionExcepcionalRepositorio
        extends JpaRepository<SituacionExcepcional, Long> {

    List<SituacionExcepcional> findAllByOrderByFechaRegistroDesc();
}
