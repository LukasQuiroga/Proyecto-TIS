
package com.lacomarcasoft.service;

import com.lacomarcasoft.service.ConsultaIngresoServicio.EstudianteIdentificado;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ConsultaIngresoCodigoServicioTest {

    private JdbcTemplate jdbc;
    private ConsultaIngresoServicio servicio;

    @BeforeEach
    void preparar() {
        jdbc = mock(JdbcTemplate.class);
        servicio = new ConsultaIngresoServicio(jdbc);
    }

    private void examenExiste(Long idExamen) {
        when(jdbc.queryForObject(
                anyString(),
                eq(Boolean.class),
                eq(idExamen)
        )).thenReturn(true);
    }

    private EstudianteIdentificado estudiante(
            Long idExamen,
            Long idEstudiante,
            String codigo,
            boolean asociado) {

        return new EstudianteIdentificado(
                idExamen,
                idEstudiante,
                "12345678",
                codigo,
                "Juan Perez",
                asociado
        );
    }

    @SuppressWarnings("unchecked")
    private void prepararResultados(
            Long idExamen,
            String codigo,
            List<EstudianteIdentificado> resultados) {

        when(jdbc.query(
                anyString(),
                any(RowMapper.class),
                eq(idExamen),
                eq(codigo)
        )).thenReturn(resultados);
    }

    @Test
    void debeIdentificarEstudiantePorCodigo() {
        examenExiste(1L);
        prepararResultados(
                1L,
                "202012345",
                List.of(estudiante(1L, 25L, "202012345", true))
        );

        EstudianteIdentificado resultado =
                servicio.identificarPorCodigo(1L, "202012345");

        assertEquals(25L, resultado.idEstudiante());
        assertEquals("202012345", resultado.codigoUniversitario());
        assertEquals("Juan Perez", resultado.nombreEstudiante());
    }

    @Test
    void debeInformarCodigoNoEncontrado() {
        examenExiste(1L);
        prepararResultados(1L, "99999999", List.of());

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> servicio.identificarPorCodigo(1L, "99999999")
        );

        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
    }

    @Test
    void debeRechazarCodigoVacio() {
        for (String codigo : new String[]{null, "", "   "}) {
            ResponseStatusException error = assertThrows(
                    ResponseStatusException.class,
                    () -> servicio.identificarPorCodigo(1L, codigo)
            );

            assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        }

        verifyNoInteractions(jdbc);
    }

    @Test
    void debeMantenerEstudianteIdentificado() {
        examenExiste(1L);
        prepararResultados(
                1L,
                "202012345",
                List.of(estudiante(1L, 25L, "202012345", true))
        );

        EstudianteIdentificado resultado =
                servicio.identificarPorCodigo(1L, "202012345");

        assertEquals(1L, resultado.idExamen());
        assertEquals(25L, resultado.idEstudiante());
        assertTrue(resultado.asociadoAlExamen());
    }

    @Test
    void debeEliminarEspaciosDelCodigo() {
        examenExiste(1L);
        prepararResultados(
                1L,
                "202012345",
                List.of(estudiante(1L, 25L, "202012345", true))
        );

        EstudianteIdentificado resultado =
                servicio.identificarPorCodigo(1L, "  202012345  ");

        assertEquals("202012345", resultado.codigoUniversitario());

        verify(jdbc).query(
                anyString(),
                any(RowMapper.class),
                eq(1L),
                eq("202012345")
        );
    }

    @Test
    void debeRechazarFormatoInvalido() {
        String[] codigos = {
                "2020 12345",
                "2020@123",
                "2020/12345",
                "2020_12345"
        };

        for (String codigo : codigos) {
            ResponseStatusException error = assertThrows(
                    ResponseStatusException.class,
                    () -> servicio.identificarPorCodigo(1L, codigo)
            );

            assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        }

        verifyNoInteractions(jdbc);
    }

    @Test
    void debeRechazarCodigoDemasiadoLargo() {
        String codigo = "1".repeat(31);

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> servicio.identificarPorCodigo(1L, codigo)
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        verifyNoInteractions(jdbc);
    }

    @Test
    void debeRechazarContenidoMalicioso() {
        String[] codigos = {
                "<script>alert(1)</script>",
                "' OR '1'='1",
                "123; DROP TABLE usuario"
        };

        for (String codigo : codigos) {
            ResponseStatusException error = assertThrows(
                    ResponseStatusException.class,
                    () -> servicio.identificarPorCodigo(1L, codigo)
            );

            assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        }

        verifyNoInteractions(jdbc);
    }

    @Test
    void debeRechazarExamenInvalido() {
        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> servicio.identificarPorCodigo(0L, "202012345")
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        verifyNoInteractions(jdbc);
    }

    @Test
    void debeInformarExamenInexistente() {
        when(jdbc.queryForObject(
                anyString(),
                eq(Boolean.class),
                eq(999L)
        )).thenReturn(false);

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> servicio.identificarPorCodigo(999L, "202012345")
        );

        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
    }

    @Test
    void debeRechazarCodigoDuplicado() {
        examenExiste(1L);

        prepararResultados(
                1L,
                "202012345",
                List.of(
                        estudiante(1L, 25L, "202012345", true),
                        estudiante(1L, 30L, "202012345", true)
                )
        );

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> servicio.identificarPorCodigo(1L, "202012345")
        );

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
    }
    
    @Test
    void debeDetectarErrorDeConexion() {
        when(jdbc.queryForObject(
                anyString(),
                eq(Boolean.class),
                eq(1L)
        )).thenThrow(
                new DataAccessResourceFailureException(
                        "Sin conexion con la base de datos"
                )
        );

        assertThrows(
                DataAccessResourceFailureException.class,
                () -> servicio.identificarPorCodigo(1L, "202012345")
        );
    }
}
