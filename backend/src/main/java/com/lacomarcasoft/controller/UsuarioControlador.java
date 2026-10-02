package com.lacomarcasoft.controller;


import com.lacomarcasoft.dto.request.ActualizarUsuarioSolicitud;
import com.lacomarcasoft.dto.request.CambiarRolSolicitud;
import com.lacomarcasoft.dto.request.DetectarDuplicadosSolicitud;
import com.lacomarcasoft.dto.request.RegistrarUsuarioSolicitud;
import com.lacomarcasoft.dto.response.CampoError;
import com.lacomarcasoft.dto.response.DeteccionDuplicadosRespuesta;
import com.lacomarcasoft.dto.response.ErroresRegistroRespuesta;
import com.lacomarcasoft.dto.response.UsuarioRespuesta;
import com.lacomarcasoft.modelo.Usuario;
import com.lacomarcasoft.service.LogActividadServicio;
import com.lacomarcasoft.service.UsuarioServicio;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import java.util.List;


@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "*")
public class UsuarioControlador {

    private static final Logger LOG =
            LoggerFactory.getLogger(
                    UsuarioControlador.class
            );


    private final UsuarioServicio usuarioServicio;

    private final LogActividadServicio logActividadServicio;


    public UsuarioControlador(
            UsuarioServicio usuarioServicio,
            LogActividadServicio logActividadServicio
    ){

        this.usuarioServicio = usuarioServicio;
        this.logActividadServicio = logActividadServicio;

    }

    @GetMapping
    public ResponseEntity<List<UsuarioRespuesta>> listarUsuarios(){

        return ResponseEntity.ok(
                usuarioServicio.listar()
        );

    }

    @PostMapping
    public ResponseEntity<UsuarioRespuesta> registrarUsuario(

            @RequestHeader(
                    value = "X-Usuario-Id",
                    required = false
            )
            Long idUsuarioResponsable,

            @Valid
            @RequestBody RegistrarUsuarioSolicitud solicitud,

            HttpServletRequest request

    ){

        UsuarioRespuesta respuesta =
                usuarioServicio.registrar(solicitud);

        registrarAuditoriaRegistro(
                idUsuarioResponsable,
                respuesta,
                request
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(respuesta);

    }


    @GetMapping("/verificar-codigo-sis")
    public ResponseEntity<Boolean> verificarCodigoSisDisponible(
            @RequestParam("codigo") String codigoSis
    ){

        return ResponseEntity.ok(
                usuarioServicio.codigoSisDisponible(codigoSis)
        );

    }

    @PostMapping("/detectar-duplicados")
    public ResponseEntity<DeteccionDuplicadosRespuesta> detectarDuplicados(
            @Valid
            @RequestBody DetectarDuplicadosSolicitud solicitud
    ){

        return ResponseEntity.ok(
                usuarioServicio.detectarDuplicados(
                        solicitud.codigosSis()
                )
        );

    }

    @GetMapping("/{id}")
    public ResponseEntity<UsuarioRespuesta> obtenerUsuario(
            @PathVariable Long id
    ){

        return ResponseEntity.ok(
                usuarioServicio.buscarRespuesta(id)
        );

    }


    @PutMapping("/{id}")
    public ResponseEntity<UsuarioRespuesta> modificarUsuario(

            @PathVariable Long id,

            @RequestHeader(
                    value = "X-Usuario-Id",
                    required = false
            )
            Long idUsuarioResponsable,

            @Valid
            @RequestBody ActualizarUsuarioSolicitud solicitud,

            HttpServletRequest request

    ){

        usuarioServicio.modificar(
                id,
                solicitud
        );


        registrarAuditoria(
                idUsuarioResponsable,
                id,
                solicitud,
                request

        );

        return ResponseEntity.ok(
                usuarioServicio.buscarRespuesta(id)

        );

    }


    @PutMapping("/{id}/rol")
    public ResponseEntity<UsuarioRespuesta> cambiarRol(

            @PathVariable Long id,

            @Valid
            @RequestBody CambiarRolSolicitud solicitud


    ){

        Usuario usuario =

                usuarioServicio.cambiarRol(
                        id,
                        solicitud.idRol()
                );


        return ResponseEntity.ok(
                usuarioServicio.buscarRespuesta(
                        usuario.getIdUsuario()
                )

        );


    }


    private void registrarAuditoria(

            Long idUsuarioResponsable,
            Long idUsuarioModificado,
            ActualizarUsuarioSolicitud solicitud,
            HttpServletRequest request

    ){

        try {

            logActividadServicio.registrar(

                    idUsuarioResponsable,

                    "MODIFICAR_USUARIO",

                    "Se modificó usuario con id "
                    +
                    idUsuarioModificado
                    +
                    ", correo actualizado: "
                    +
                    solicitud.correo()
                    +
                    ", rol asignado: "
                    +
                    solicitud.idRol(),

                    request.getRemoteAddr(),

                    true
            );

        } catch (Exception e) {

            LOG.error(
                    "No se pudo registrar la auditoría",
                    e
            );

        }
    }

    private void registrarAuditoriaRegistro(

            Long idUsuarioResponsable,
            UsuarioRespuesta respuesta,
            HttpServletRequest request

    ){

        try {

            logActividadServicio.registrar(

                    idUsuarioResponsable,

                    "REGISTRAR_USUARIO",

                    "Se registró usuario con id "
                    +
                    respuesta.idUsuario()
                    +
                    ", correo: "
                    +
                    respuesta.correo()
                    +
                    ", rol asignado: "
                    +
                    respuesta.idRol(),

                    request.getRemoteAddr(),

                    true
            );

        } catch (Exception e) {

            LOG.error(
                    "No se pudo registrar la auditoría",
                    e
            );

        }
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErroresRegistroRespuesta> manejarValidacion(
            MethodArgumentNotValidException e
    ){

        List<CampoError> errores =
                e.getBindingResult()
                        .getFieldErrors()
                        .stream()
                        .map(
                                error ->
                                        new CampoError(
                                                error.getField(),
                                                error.getDefaultMessage()
                                        )
                        )
                        .toList();

        return ResponseEntity
                .badRequest()
                .body(
                        new ErroresRegistroRespuesta(
                                errores
                        )
                );

    }

}