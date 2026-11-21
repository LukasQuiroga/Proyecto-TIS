package com.lacomarcasoft.controller;

import com.lacomarcasoft.dto.request.ActualizarPermisosSolicitud;
import com.lacomarcasoft.dto.response.RolRespuesta;
import com.lacomarcasoft.modelo.Rol;
import com.lacomarcasoft.service.RolServicio;
import com.lacomarcasoft.dto.request.CrearRolSolicitud;
import com.lacomarcasoft.dto.response.CampoError;
import com.lacomarcasoft.dto.response.ErroresRegistroRespuesta;
import com.lacomarcasoft.service.AuditoriaAccionesServicio;
import org.springframework.web.bind.MethodArgumentNotValidException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
@CrossOrigin(origins = "*")
public class RolControlador {

    private final RolServicio rolServicio;
    private final AuditoriaAccionesServicio auditoria;


    public RolControlador(
            RolServicio rolServicio,
            AuditoriaAccionesServicio auditoria
    ){

        this.rolServicio = rolServicio;
        this.auditoria = auditoria;

    }


    @GetMapping
    public ResponseEntity<List<RolRespuesta>> listarRoles(){

        return ResponseEntity.ok(
                rolServicio.listar()
        );
    }


    @GetMapping("/{id}")
    public ResponseEntity<RolRespuesta> obtenerRol(
            @PathVariable Long id
    ){

        return ResponseEntity.ok(
                rolServicio.buscarRespuesta(id)
        );
    }

    @PostMapping
        public ResponseEntity<RolRespuesta> crearRol(
                @Valid 
                @RequestBody CrearRolSolicitud solicitud,
                Authentication authentication,
                HttpServletRequest request
        ){

        RolRespuesta respuesta =
                rolServicio.crear(
                        solicitud
                );

        auditoria.registrar(
                authentication,
                request,
                "CREAR_ROL",
                "Creación del rol " + respuesta.nombreRol()
        );

        return ResponseEntity.ok(respuesta);

    }

    @PutMapping("/{id}/permisos")
    public ResponseEntity<RolRespuesta> actualizarPermisos(
            @PathVariable Long id,
            @RequestBody ActualizarPermisosSolicitud solicitud,
            Authentication authentication,
            HttpServletRequest request
    ){

        Rol rol =
                rolServicio.actualizarPermisos(
                        id,
                        solicitud.permisos()
                );

        auditoria.registrar(
                authentication,
                request,
                "ACTUALIZAR_PERMISOS_ROL",
                "Actualización de permisos del rol #" + id
        );

        return ResponseEntity.ok(
                rolServicio.buscarRespuesta(
                        rol.getIdRol()
                )
        );

    }

    @ExceptionHandler(IllegalArgumentException.class)
        public ResponseEntity<String> manejarError(
                IllegalArgumentException e
        ){
        return ResponseEntity
                .badRequest()
                .body(e.getMessage());
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