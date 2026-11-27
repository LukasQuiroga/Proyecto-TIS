package com.lacomarcasoft.controller;

import com.lacomarcasoft.dto.request.ModificarHabilitacionSolicitud;
import com.lacomarcasoft.dto.request.ModificarHabilitacionMasivaSolicitud;
import com.lacomarcasoft.dto.response.HabilitacionRespuesta;
import com.lacomarcasoft.dto.response.HistorialHabilitacionRespuesta;
import com.lacomarcasoft.dto.response.ResultadoHabilitacionMasiva;
import com.lacomarcasoft.service.AuditoriaAccionesServicio;
import com.lacomarcasoft.service.HabilitacionServicio;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/habilitaciones")
public class HabilitacionControlador {
    private final HabilitacionServicio servicio;
    private final AuditoriaAccionesServicio auditoria;

    public HabilitacionControlador(
            HabilitacionServicio servicio,
            AuditoriaAccionesServicio auditoria
    ) {
        this.servicio = servicio;
        this.auditoria = auditoria;
    }

    @GetMapping("/examenes/codigo/{codigo}")
    public java.util.Map<String, Long> buscarPorCodigo(
            @PathVariable String codigo, Authentication auth) {
        Long idExamen = servicio.buscarIdPorCodigo(codigo, usuario(auth));
        return java.util.Map.of("idExamen", idExamen);
    }

    @GetMapping("/examenes/{idExamen}")
    public List<HabilitacionRespuesta> listar(
            @PathVariable Long idExamen, Authentication auth) {
        return servicio.listar(idExamen, usuario(auth));
    }

    @GetMapping("/examenes/{idExamen}/estudiantes/{idEstudiante}")
    public HabilitacionRespuesta detalle(
            @PathVariable Long idExamen,
            @PathVariable Long idEstudiante, Authentication auth) {
        return servicio.buscar(idExamen, idEstudiante, usuario(auth));
    }

    @PutMapping("/examenes/{idExamen}")
    public HabilitacionRespuesta modificar(
            @PathVariable Long idExamen,
            @Valid @RequestBody ModificarHabilitacionSolicitud solicitud,
            Authentication auth,
            HttpServletRequest request) {

        HabilitacionRespuesta respuesta =
                servicio.modificar(idExamen, solicitud, usuario(auth));

        auditoria.registrar(
                auth,
                request,
                "ACTUALIZAR_HABILITACION",
                "Actualización de la habilitación del estudiante "
                        + solicitud.idEstudiante()
                        + " en el examen " + idExamen
        );

        return respuesta;
    }

    @PutMapping("/examenes/{idExamen}/masivo")
    public ResultadoHabilitacionMasiva modificarMasivo(
            @PathVariable Long idExamen,
            @Valid @RequestBody ModificarHabilitacionMasivaSolicitud solicitud,
            Authentication auth,
            HttpServletRequest request) {
        Long responsableId = usuario(auth);
        servicio.listar(idExamen, responsableId);

        Set<Long> ids = new HashSet<>();
        for (ModificarHabilitacionSolicitud item : solicitud.estudiantes()) {
            if (!ids.add(item.idEstudiante())) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "No se permiten estudiantes duplicados"
                );
            }
        }

        List<ResultadoHabilitacionMasiva.DetalleResultado> resultados =
            new ArrayList<>();

        int exitosos = 0;
        for (ModificarHabilitacionSolicitud item : solicitud.estudiantes()) {
            try {
                servicio.modificar(idExamen, item, responsableId);
                exitosos++;
                resultados.add(
                    new ResultadoHabilitacionMasiva.DetalleResultado(
                        item.idEstudiante(), true, "Actualizado correctamente"
                    )
                );
            } catch (ResponseStatusException ex) {
                resultados.add(
                    new ResultadoHabilitacionMasiva.DetalleResultado(
                        item.idEstudiante(),
                        false,
                        ex.getReason() == null
                            ? "No se pudo actualizar"
                            : ex.getReason()
                    )
                );
            }
        }

        ResultadoHabilitacionMasiva resultado =
                new ResultadoHabilitacionMasiva(
                    solicitud.estudiantes().size(),
                    exitosos,
                    resultados.size() - exitosos,
                    resultados
                );

        auditoria.registrar(
                auth,
                request,
                "ACTUALIZAR_HABILITACION_MASIVA",
                "Actualización masiva de habilitaciones del examen "
                        + idExamen + ": " + exitosos
                        + " correctas y "
                        + (resultados.size() - exitosos) + " fallidas"
        );

        return resultado;
    }

    @GetMapping("/examenes/{idExamen}/estudiantes/{idEstudiante}/historial")
    public List<HistorialHabilitacionRespuesta> historial(
            @PathVariable Long idExamen,
            @PathVariable Long idEstudiante,
            Authentication auth) {
        return servicio.historial(
            idExamen, idEstudiante, usuario(auth)
        );
    }

    private Long usuario(Authentication auth) {
        if (auth == null || !(auth.getDetails() instanceof Long id)) {
            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED, "Inicie sesion"
            );
        }
        return id;
    }
}
