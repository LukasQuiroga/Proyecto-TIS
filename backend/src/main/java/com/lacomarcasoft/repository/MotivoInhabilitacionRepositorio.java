
package com.lacomarcasoft.repository;

import com.lacomarcasoft.modelo.MotivoInhabilitacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MotivoInhabilitacionRepositorio extends JpaRepository<MotivoInhabilitacion, Long> {
    List<MotivoInhabilitacion> findByActivoTrueOrderByTituloAsc();
    List<MotivoInhabilitacion> findAllByOrderByTituloAsc();
    boolean existsByTituloIgnoreCase(String titulo);
}