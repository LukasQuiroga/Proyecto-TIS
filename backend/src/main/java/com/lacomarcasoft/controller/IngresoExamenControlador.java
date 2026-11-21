package com.lacomarcasoft.controller;

import com.lacomarcasoft.dto.request.ActualizarIngresoSolicitud;
import com.lacomarcasoft.dto.request.RegistrarIngresoSolicitud;
import com.lacomarcasoft.dto.response.EstadoIngresoRespuesta;
import com.lacomarcasoft.dto.response.IngresoRegistradoDetalleRespuesta;
import com.lacomarcasoft.dto.response.IngresoRegistradoRespuesta;
import com.lacomarcasoft.service.AuditoriaAccionesServicio;
import com.lacomarcasoft.service.IngresoExamenServicio;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ingresos/examenes")
public class IngresoExamenControlador {

    private final IngresoExamenServicio servicio;
    private final AuditoriaAccionesServicio auditoria;

    public IngresoExamenControlador(
            IngresoExamenServicio servicio,
            AuditoriaAccionesServicio auditoria) {
        this.servicio = servicio;
        this.auditoria = auditoria;
    }

    @GetMapping("/{idExamen}/estudiantes/{idEstudiante}")
    public EstadoIngresoRespuesta consultar(
            @PathVariable Long idExamen,
            @PathVariable Long idEstudiante) {

        return servicio.consultar(idExamen, idEstudiante);
    }

    @PostMapping(
            value = "/{idExamen}/estudiantes/{idEstudiante}/intentos-duplicados",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void registrarIntentoDuplicado(
            @PathVariable Long idExamen,
            @PathVariable Long idEstudiante,
            @RequestParam("foto") MultipartFile archivo,
            Authentication auth,
            HttpServletRequest request) {

        Long responsable =
            auth != null && auth.getDetails() instanceof Long id
                ? id
                : null;

        servicio.registrarIntentoDuplicado(
            idExamen,
            idEstudiante,
            responsable,
            archivo
        );

        auditoria.registrar(
            auth,
            request,
            "REGISTRAR_INTENTO_DUPLICADO",
            "Intento de ingreso duplicado del estudiante "
                    + idEstudiante + " en el examen " + idExamen,
            false
        );
    }

    @GetMapping("/registrados")
    public List<IngresoRegistradoRespuesta> listarRegistrados(
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "idExamen", required = false) Long idExamen,
            @RequestParam(value = "fecha", required = false) String fecha) {

        return servicio.listarRegistrados(q, idExamen, fecha);
    }

    @GetMapping("/registrados/{idIngreso}")
    public IngresoRegistradoDetalleRespuesta obtenerRegistrado(@PathVariable Long idIngreso) {
        return servicio.obtenerRegistrado(idIngreso);
    }

    @PutMapping("/registrados/{idIngreso}")
    public IngresoRegistradoDetalleRespuesta actualizarRegistrado(
            @PathVariable Long idIngreso,
            @Valid @RequestBody ActualizarIngresoSolicitud solicitud,
            Authentication auth,
            HttpServletRequest request) {

        IngresoRegistradoDetalleRespuesta respuesta =
                servicio.actualizarRegistrado(idIngreso, solicitud);

        auditoria.registrar(
            auth,
            request,
            "ACTUALIZAR_INGRESO",
            "Actualización del ingreso #" + idIngreso
                    + " del estudiante " + respuesta.idEstudiante()
        );

        return respuesta;
    }

    @PostMapping("/{idExamen}/ingresos")
    @ResponseStatus(HttpStatus.CREATED)
    public EstadoIngresoRespuesta registrar(
            @PathVariable Long idExamen,
            @Valid @RequestBody RegistrarIngresoSolicitud solicitud,
            Authentication auth,
            HttpServletRequest request) {

        Long responsable =
            auth != null && auth.getDetails() instanceof Long id
                ? id
                : null;

        EstadoIngresoRespuesta respuesta = servicio.registrar(
            idExamen,
            solicitud.idEstudiante(),
            responsable
        );

        auditoria.registrar(
            auth,
            request,
            "REGISTRAR_INGRESO",
            "Registro de ingreso del estudiante "
                    + solicitud.idEstudiante()
                    + " al examen " + idExamen
        );

        return respuesta;
    }

    @ExceptionHandler(ResponseStatusException.class)
    public org.springframework.http.ResponseEntity<Map<String, String>> error(
            ResponseStatusException ex) {

        return org.springframework.http.ResponseEntity
            .status(ex.getStatusCode())
            .body(Map.of(
                "mensaje",
                ex.getReason() == null
                    ? "No se pudo procesar el ingreso"
                    : ex.getReason()
            ));
    }
}
