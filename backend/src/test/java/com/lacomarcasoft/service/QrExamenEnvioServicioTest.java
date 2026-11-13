package com.lacomarcasoft.service;

import com.lacomarcasoft.modelo.Asignatura;
import com.lacomarcasoft.modelo.Examen;
import com.lacomarcasoft.modelo.Materia;
import com.lacomarcasoft.modelo.QrExamenEstudiante;
import com.lacomarcasoft.modelo.Usuario;
import com.lacomarcasoft.repository.ExamenRepositorio;
import com.lacomarcasoft.repository.QrExamenEstudianteRepositorio;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class QrExamenEnvioServicioTest {

    private static final Long ID_EXAMEN = 10L;

    private QrExamenEstudianteRepositorio qrRepositorio;
    private ExamenRepositorio examenRepositorio;
    private QrExamenServicio qrExamenServicio;
    private CorreoServicio correoServicio;
    private QrExamenEnvioServicio envioServicio;
    private QrExamenEstudiante qr;

    @BeforeEach
    void preparar() {
        qrRepositorio = mock(QrExamenEstudianteRepositorio.class);
        examenRepositorio = mock(ExamenRepositorio.class);
        qrExamenServicio = mock(QrExamenServicio.class);
        correoServicio = mock(CorreoServicio.class);

        envioServicio = new QrExamenEnvioServicio(
                qrRepositorio,
                examenRepositorio,
                qrExamenServicio,
                correoServicio
        );

        when(examenRepositorio.existsById(ID_EXAMEN))
                .thenReturn(true);

        when(qrExamenServicio.generarImagen(anyString()))
                .thenReturn(new byte[]{1, 2, 3});

        Asignatura asignatura = new Asignatura();
        asignatura.setNombreAsignatura("Algoritmos");

        Materia materia = new Materia();
        materia.setIdMateria(3L);
        materia.setGrupo("B");
        materia.setAsignatura(asignatura);

        Examen examen = new Examen();
        examen.setIdExamen(ID_EXAMEN);
        examen.setNombreExamen("Primer parcial");
        examen.setCodigo("PAR-001");
        examen.setMateria(materia);
        examen.setFechaExamen(LocalDate.now().plusDays(1));
        examen.setHoraInicio(LocalTime.of(8, 0));
        examen.setHoraFin(LocalTime.of(10, 0));

        Usuario estudiante = new Usuario();
        estudiante.setIdUsuario(5L);
        estudiante.setNombre("Ana");
        estudiante.setApellido("Perez");
        estudiante.setCorreo("ana@example.com");

        qr = new QrExamenEstudiante();
        qr.setExamen(examen);
        qr.setEstudiante(estudiante);
        qr.setMateria(materia);
        qr.setTokenCifrado("token-cifrado");
        qr.setEstadoEnvio("PENDIENTE");
        qr.setIntentosEnvio(0);
        qr.setRevocado(false);

        when(qrRepositorio.listarPendientesPorExamen(ID_EXAMEN))
                .thenReturn(List.of(qr));
    }

    @Test
    void debeMarcarQrComoEnviado() {
        QrExamenEnvioServicio.ResultadoEnvioQr resultado =
                envioServicio.reenviarPendientes(ID_EXAMEN);

        assertEquals(1, resultado.total());
        assertEquals(1, resultado.enviados());
        assertEquals(0, resultado.fallidos());

        assertEquals("ENVIADO", qr.getEstadoEnvio());
        assertEquals(1, qr.getIntentosEnvio());
        assertNotNull(qr.getFechaEnvio());
        assertNull(qr.getUltimoError());

        verify(qrRepositorio).save(qr);
    }

    @Test
    void debeMarcarErrorSinPropagarFalloDeCorreo() {
        doThrow(new IllegalStateException("Brevo no disponible"))
                .when(correoServicio)
                .enviarQrExamen(
                        anyString(),
                        anyString(),
                        anyString(),
                        anyString(),
                        anyString(),
                        anyString(),
                        any(),
                        any(),
                        any(),
                        any(byte[].class)
                );

        QrExamenEnvioServicio.ResultadoEnvioQr resultado =
                envioServicio.reenviarPendientes(ID_EXAMEN);

        assertEquals(1, resultado.total());
        assertEquals(0, resultado.enviados());
        assertEquals(1, resultado.fallidos());

        assertEquals("ERROR", qr.getEstadoEnvio());
        assertTrue(qr.getUltimoError().contains("Brevo"));
        assertNull(qr.getFechaEnvio());

        verify(qrRepositorio).save(qr);
    }

    @Test
    void debeRechazarExamenInexistente() {
        when(examenRepositorio.existsById(99L))
                .thenReturn(false);

        assertThrows(
                RuntimeException.class,
                () -> envioServicio.reenviarPendientes(99L)
        );
    }
}
