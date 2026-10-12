package com.lacomarcasoft.repository;

import com.lacomarcasoft.modelo.Ambiente;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface AmbienteRepositorio extends JpaRepository<Ambiente, Long> {

    @Query("""
        SELECT COUNT(a) > 0
        FROM Ambiente a
        WHERE UPPER(TRIM(a.codigo)) = UPPER(TRIM(:codigo))
        """)
    boolean existeCodigo(@Param("codigo") String codigo);

    @Query("""
        SELECT COUNT(a) > 0
        FROM Ambiente a
        WHERE UPPER(TRIM(a.codigo)) = UPPER(TRIM(:codigo))
          AND a.idAmbiente <> :idAmbiente
        """)
    boolean existeCodigoEnOtroAmbiente(
            @Param("codigo") String codigo,
            @Param("idAmbiente") Long idAmbiente
    );

    @Query("""
        SELECT a
        FROM Ambiente a
        WHERE LOWER(a.codigo) LIKE LOWER(CONCAT('%', :texto, '%'))
           OR LOWER(a.nombre) LIKE LOWER(CONCAT('%', :texto, '%'))
           OR LOWER(a.ubicacion) LIKE LOWER(CONCAT('%', :texto, '%'))
        ORDER BY a.codigo ASC
        """)
    List<Ambiente> buscar(
            @Param("texto") String texto
    );

    @Query(
            value = """
                SELECT COUNT(*) > 0
                FROM academico.examen e
                WHERE e.id_ambiente = :idAmbiente
                  AND e.fecha_examen = :fecha
                  AND e.hora_inicio < :horaFin
                  AND e.hora_fin > :horaInicio
                  AND (CAST(:idExamenExcluir AS BIGINT) IS NULL
                       OR e.id_examen <> :idExamenExcluir)
                """,
            nativeQuery = true
    )
    boolean existeConflictoHorario(
            @Param("idAmbiente") Long idAmbiente,
            @Param("fecha") LocalDate fecha,
            @Param("horaInicio") LocalTime horaInicio,
            @Param("horaFin") LocalTime horaFin,
            @Param("idExamenExcluir") Long idExamenExcluir
    );

    List<Ambiente> findAllByOrderByCodigoAsc();
}