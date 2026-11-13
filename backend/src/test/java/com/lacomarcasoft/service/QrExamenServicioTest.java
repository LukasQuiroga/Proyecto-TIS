package com.lacomarcasoft.service;

import com.lacomarcasoft.modelo.Examen;
import com.lacomarcasoft.modelo.Materia;
import com.lacomarcasoft.modelo.QrExamenEstudiante;
import com.lacomarcasoft.modelo.Usuario;
import com.lacomarcasoft.repository.ExamenEstudianteRepositorio;
import com.lacomarcasoft.repository.MateriaEstudianteRepositorio;
import com.lacomarcasoft.repository.QrExamenEstudianteRepositorio;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

class QrExamenServicioTest {

    private static final Long ID_EXAMEN = 10L;
    private static final Long ID_MATERIA = 3L;

    private QrExamenEstudianteRepositorio qrRepositorio;
    private MateriaEstudianteRepositorio materiaEstudianteRepositorio;
    private ExamenEstudianteRepositorio examenEstudianteRepositorio;
    private QrExamenServicio qrExamenServicio;
    private Examen examen;

    @BeforeEach
    void preparar() {
        qrRepositorio = mock(QrExamenEstudianteRepositorio.class);
        materiaEstudianteRepositorio =
                mock(MateriaEstudianteRepositorio.class);
        examenEstudianteRepositorio =
                mock(ExamenEstudianteRepositorio.class);

        QrTokenCifradoServicio cifradoServicio =
                new QrTokenCifradoServicio(
                        Base64.getEncoder().encodeToString(
                                new byte[32]
                        )
                );

        qrExamenServicio = new QrExamenServicio(
                qrRepositorio,
                materiaEstudianteRepositorio,
                examenEstudianteRepositorio,
                cifradoServicio
        );

        Materia materia = new Materia();
        materia.setIdMateria(ID_MATERIA);

        examen = new Examen();
        examen.setIdExamen(ID_EXAMEN);
        examen.setMateria(materia);
        examen.setFechaExamen(LocalDate.now().plusDays(1));
        examen.setHoraInicio(LocalTime.of(8, 0));
        examen.setHoraFin(LocalTime.of(10, 0));

        when(qrRepositorio.save(any(QrExamenEstudiante.class)))
                .thenAnswer(invocacion -> invocacion.getArgument(0));
    }

    private Usuario crearEstudiante(Long id, boolean activo) {
        Usuario estudiante = mock(Usuario.class);
        when(estudiante.getIdUsuario()).thenReturn(id);
        when(estudiante.getActivo()).thenReturn(activo);
        return estudiante;
    }

    @Test
    void debeGenerarUnQrPorCadaEstudianteActivo() {
        Usuario primero = crearEstudiante(1L, true);
        Usuario segundo = crearEstudiante(2L, true);

        when(materiaEstudianteRepositorio
                .listarEstudiantesActivosPorMateria(ID_MATERIA))
                .thenReturn(List.of(primero, segundo));

        when(qrRepositorio
                .findByExamen_IdExamenAndEstudiante_IdUsuario(
                        anyLong(),
                        anyLong()
                ))
                .thenReturn(Optional.empty());

        List<QrExamenEstudiante> generados =
                qrExamenServicio.generarFaltantesParaExamen(examen);

        assertEquals(2, generados.size());

        assertNotEquals(
                generados.get(0).getTokenCifrado(),
                generados.get(1).getTokenCifrado()
        );

        for (QrExamenEstudiante qr : generados) {
            assertEquals("PENDIENTE", qr.getEstadoEnvio());
            assertEquals(0, qr.getIntentosEnvio());
            assertFalse(qr.getRevocado());
            assertEquals(
                    qrExamenServicio.calcularHash(
                            qr.getTokenCifrado()
                    ),
                    qr.getTokenHash()
            );
            assertEquals(ID_EXAMEN, qr.getExamen().getIdExamen());
            assertEquals(ID_MATERIA, qr.getMateria().getIdMateria());
        }

        verify(examenEstudianteRepositorio, times(2))
                .insertarSiNoExiste(anyLong(), anyLong());
    }

    @Test
    void debeReutilizarQrExistenteNoRevocado() {
        QrExamenEstudiante existente = new QrExamenEstudiante();
        existente.setRevocado(false);

        when(qrRepositorio
                .findByExamen_IdExamenAndEstudiante_IdUsuario(
                        ID_EXAMEN,
                        1L
                ))
                .thenReturn(Optional.of(existente));

        Optional<QrExamenEstudiante> resultado =
                qrExamenServicio.generarParaEstudiante(
                        examen,
                        crearEstudiante(1L, true)
                );

        assertTrue(resultado.isEmpty());

        verify(qrRepositorio, never())
                .save(any(QrExamenEstudiante.class));

        verifyNoInteractions(examenEstudianteRepositorio);
    }

    @Test
    void debeRechazarGeneracionSinProgramacion() {
        examen.setFechaExamen(null);

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> qrExamenServicio.generarFaltantesParaExamen(
                        examen
                )
        );

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
    }

    @Test
    void debeGenerarImagenPngDelToken() {
        byte[] imagen = qrExamenServicio.generarImagen(
                "token-de-prueba"
        );

        assertTrue(imagen.length > 0);

        assertArrayEquals(
                new byte[]{
                        (byte) 0x89,
                        (byte) 0x50,
                        (byte) 0x4E,
                        (byte) 0x47
                },
                Arrays.copyOf(imagen, 4)
        );
    }

    @Test
    void debeRecuperarElContenidoDelToken() {
        String token = qrExamenServicio.crearToken(
                ID_EXAMEN,
                1L,
                ID_MATERIA
        );

        QrExamenServicio.ContenidoQrExamen contenido =
                qrExamenServicio.leerContenido(token);

        assertEquals(1, contenido.version());
        assertEquals(ID_EXAMEN, contenido.idExamen());
        assertEquals(1L, contenido.idEstudiante());
        assertEquals(ID_MATERIA, contenido.idMateria());
        assertNotNull(contenido.nonce());
    }

    @Test
    void debeAsignarValoresPendientesAlGuardar() {
        when(qrRepositorio
                .findByExamen_IdExamenAndEstudiante_IdUsuario(
                        anyLong(),
                        anyLong()
                ))
                .thenReturn(Optional.empty());

        qrExamenServicio.generarParaEstudiante(
                examen,
                crearEstudiante(1L, true)
        );

        ArgumentCaptor<QrExamenEstudiante> captor =
                ArgumentCaptor.forClass(QrExamenEstudiante.class);

        verify(qrRepositorio).save(captor.capture());

        QrExamenEstudiante guardado = captor.getValue();

        assertNotNull(guardado.getTokenHash());
        assertEquals("PENDIENTE", guardado.getEstadoEnvio());
        assertEquals(0, guardado.getIntentosEnvio());
        assertNull(guardado.getUltimoError());
    }
}
