package com.lacomarcasoft.service;

import com.lacomarcasoft.service.ConsultaIngresoServicio.EstudianteIdentificado;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.web.server.ResponseStatusException;

import java.sql.ResultSet;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ConsultaIngresoServicioTest {

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

    private void prepararResultados(
            Long idExamen,
            String documento,
            List<EstudianteIdentificado> resultados) {

        when(jdbc.query(
            anyString(),
            ArgumentMatchers.<RowMapper<EstudianteIdentificado>>any(),
            eq(idExamen),
            eq(documento)
        )).thenReturn(resultados);
    }

    // CA1, CA3 y CA6: recuperar el estudiante correcto
    @Test
    void debeIdentificarEstudiantePorDocumento() throws Exception {
        examenExiste(1L);

        when(jdbc.query(
            anyString(),
            ArgumentMatchers.<RowMapper<EstudianteIdentificado>>any(),
            eq(1L),
            eq("12345678")
        )).thenAnswer(invocacion -> {
            RowMapper<EstudianteIdentificado> mapper =
                invocacion.getArgument(1);

            ResultSet rs = mock(ResultSet.class);

            when(rs.getLong("id_usuario")).thenReturn(25L);
            when(rs.getString("carnet_identidad"))
                .thenReturn("12345678");
            when(rs.getString("codigo_sis"))
                .thenReturn("202012345");
            when(rs.getString("nombre_estudiante"))
                .thenReturn("Juan Perez");
            when(rs.getBoolean("asociado_examen"))
                .thenReturn(true);

            return List.of(mapper.mapRow(rs, 0));
        });

        EstudianteIdentificado resultado =
            servicio.identificarPorDocumento(1L, "12345678");

        assertEquals(1L, resultado.idExamen());
        assertEquals(25L, resultado.idEstudiante());
        assertEquals("12345678", resultado.documentoIdentidad());
        assertEquals("202012345", resultado.codigoUniversitario());
        assertEquals("Juan Perez", resultado.nombreEstudiante());
        assertTrue(resultado.asociadoAlExamen());

        verify(jdbc).queryForObject(
            anyString(), eq(Boolean.class), eq(1L)
        );

        verify(jdbc).query(
            anyString(),
            ArgumentMatchers.<RowMapper<EstudianteIdentificado>>any(),
            eq(1L),
            eq("12345678")
        );

        // Identificar no debe registrar asistencia
        verifyNoMoreInteractions(jdbc);
    }

    // CA2: documento no registrado
    @Test
    void debeInformarDocumentoNoEncontrado() {
        examenExiste(1L);
        prepararResultados(1L, "99999999", List.of());

        ResponseStatusException error = assertThrows(
            ResponseStatusException.class,
            () -> servicio.identificarPorDocumento(1L, "99999999")
        );

        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
    }

    // CA4: documento obligatorio
    @Test
    void debeRechazarDocumentoVacio() {
        String[] documentos = {null, "", "   "};

        for (String documento : documentos) {
            ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> servicio.identificarPorDocumento(1L, documento)
            );

            assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        }

        verifyNoInteractions(jdbc);
    }

    // CA11: eliminar espacios exteriores
    @Test
    void debeEliminarEspaciosDelDocumento() {
        examenExiste(1L);

        prepararResultados(
            1L,
            "12345678",
            List.of(new EstudianteIdentificado(
                1L, 25L, "12345678",
                "202012345", "Juan Perez", true
            ))
        );

        EstudianteIdentificado resultado =
            servicio.identificarPorDocumento(1L, " 12345678 ");

        assertEquals("12345678", resultado.documentoIdentidad());

        verify(jdbc).query(
            anyString(),
            ArgumentMatchers.<RowMapper<EstudianteIdentificado>>any(),
            eq(1L),
            eq("12345678")
        );
    }

    // CA12 y CA17: formato invalido o caracteres peligrosos
    @Test
    void debeRechazarCaracteresNoPermitidos() {
        String[] documentos = {
            "ABC123",
            "12345678-",
            "123 45678",
            "12345678<script>",
            "12345678' OR '1'='1",
            "12345678@@"
        };

        for (String documento : documentos) {
            ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> servicio.identificarPorDocumento(1L, documento)
            );

            assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        }

        verifyNoInteractions(jdbc);
    }

    // CA13: longitud maxima
    @Test
    void debeRechazarDocumentoDemasiadoLargo() {
        String documento = "1".repeat(31);

        ResponseStatusException error = assertThrows(
            ResponseStatusException.class,
            () -> servicio.identificarPorDocumento(1L, documento)
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        verifyNoInteractions(jdbc);
    }

    // CA14: considerar documento con complemento completo
    @Test
    void debeIdentificarDocumentoConComplemento() {
        examenExiste(1L);

        prepararResultados(
            1L,
            "12345678-1A",
            List.of(new EstudianteIdentificado(
                1L, 30L, "12345678-1A",
                "202030000", "Maria Lopez", true
            ))
        );

        EstudianteIdentificado resultado =
            servicio.identificarPorDocumento(1L, "12345678-1A");

        assertEquals(30L, resultado.idEstudiante());
        assertEquals("12345678-1A", resultado.documentoIdentidad());

        verify(jdbc).query(
            anyString(),
            ArgumentMatchers.<RowMapper<EstudianteIdentificado>>any(),
            eq(1L),
            eq("12345678-1A")
        );
    }

    // CA9: identificar no significa autorizar el ingreso
    @Test
    void debeInformarEstudianteNoAsociadoAlExamen() {
        examenExiste(1L);

        prepararResultados(
            1L,
            "12345678",
            List.of(new EstudianteIdentificado(
                1L, 25L, "12345678",
                "202012345", "Juan Perez", false
            ))
        );

        EstudianteIdentificado resultado =
            servicio.identificarPorDocumento(1L, "12345678");

        assertFalse(resultado.asociadoAlExamen());
    }

    @Test
    void debeRechazarIdentificadorDeExamenInvalido() {
        ResponseStatusException error = assertThrows(
            ResponseStatusException.class,
            () -> servicio.identificarPorDocumento(0L, "12345678")
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
            () -> servicio.identificarPorDocumento(999L, "12345678")
        );

        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
    }

    // CA18: un fallo de consulta no debe generar identificacion exitosa
    @Test
    void debePropagarErrorDeConexion() {
        when(jdbc.queryForObject(
            anyString(),
            eq(Boolean.class),
            eq(1L)
        )).thenThrow(
            new DataAccessResourceFailureException("Sin conexion")
        );

        assertThrows(
            DataAccessResourceFailureException.class,
            () -> servicio.identificarPorDocumento(1L, "12345678")
        );
    }
}