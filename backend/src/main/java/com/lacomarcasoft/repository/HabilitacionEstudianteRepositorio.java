
package com.lacomarcasoft.repository;

import com.lacomarcasoft.modelo.HabilitacionEstudiante;
import com.lacomarcasoft.modelo.HabilitacionEstudianteId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HabilitacionEstudianteRepositorio extends JpaRepository<HabilitacionEstudiante, HabilitacionEstudianteId> {
    List<HabilitacionEstudiante> findByIdIdExamen(Long idExamen);
    List<HabilitacionEstudiante> findByIdIdExamenAndEstado(Long idExamen, String estado);
    List<HabilitacionEstudiante> findByIdIdEstudiante(Long idEstudiante);
    long countByIdIdExamenAndEstado(Long idExamen, String estado);

    @Query("""
        SELECT h FROM HabilitacionEstudiante h
        JOIN FETCH h.estudiante
        LEFT JOIN FETCH h.motivo
        WHERE h.id.idExamen = :idExamen
        ORDER BY h.estudiante.nombre ASC
        """)
    List<HabilitacionEstudiante> listarPorExamen(@Param("idExamen") Long idExamen);
}