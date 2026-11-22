package com.lacomarcasoft.repository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class LogActividadRepositorioTest {

    private NamedParameterJdbcTemplate jdbcTemplate;
    private LogActividadRepositorio repositorio;

    @BeforeEach
    void preparar() {
        jdbcTemplate = mock(NamedParameterJdbcTemplate.class);
        repositorio = new LogActividadRepositorio(jdbcTemplate);
    }

    @Test
    void consultarAplicaFiltrosEnClausulaWhere() {
        doReturn(List.of())
                .when(jdbcTemplate)
                .query(
                        anyString(),
                        any(SqlParameterSource.class),
                        any(RowMapper.class)
                );

        repositorio.consultar(
                "ACTUALIZAR EXAMEN",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                0,
                10
        );

        ArgumentCaptor<String> sql =
                ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<SqlParameterSource> parametros =
                ArgumentCaptor.forClass(
                        SqlParameterSource.class
                );

        verify(jdbcTemplate).query(
                sql.capture(),
                parametros.capture(),
                any(RowMapper.class)
        );

        String consulta = sql.getValue();
        String despuesWhere = consulta.substring(
                consulta.indexOf("WHERE 1 = 1")
        );

        assertTrue(consulta.contains("WHERE 1 = 1"));
        assertTrue(despuesWhere.contains("AND ("));
        assertFalse(despuesWhere.contains("LEFT JOIN"));
        assertEquals(
                "%actualizar%examen%",
                parametros.getValue().getValue("busqueda")
        );
    }

    @Test
    void contarAplicaFiltrosEnClausulaWhere() {
        when(jdbcTemplate.queryForObject(
                anyString(),
                any(SqlParameterSource.class),
                eq(Long.class)
        )).thenReturn(3L);

        long total = repositorio.contar(
                "ACTUALIZAR EXAMEN",
                null,
                null,
                "ACTUALIZAR_EXAMEN",
                null,
                null,
                null,
                true
        );

        ArgumentCaptor<String> sql =
                ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<SqlParameterSource> parametros =
                ArgumentCaptor.forClass(
                        SqlParameterSource.class
                );

        verify(jdbcTemplate).queryForObject(
                sql.capture(),
                parametros.capture(),
                eq(Long.class)
        );

        String consulta = sql.getValue();
        String despuesWhere = consulta.substring(
                consulta.indexOf("WHERE 1 = 1")
        );

        assertEquals(3L, total);
        assertTrue(consulta.contains("WHERE 1 = 1"));
        assertTrue(despuesWhere.contains("AND ("));
        assertTrue(despuesWhere.contains("LOWER(l.tipo_accion)"));
        assertFalse(despuesWhere.contains("LEFT JOIN"));
        assertEquals(
                "%actualizar%examen%",
                parametros.getValue().getValue("busqueda")
        );
    }
}
