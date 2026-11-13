
package com.lacomarcasoft.controller;

import com.lacomarcasoft.service.AccesoExamenDocenteServicio;
import com.lacomarcasoft.service.PerfilFotoServicio;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/ingresos/examenes/identificar-codigo")
public class IdentificacionCodigoControlador {

    private static final int LONGITUD_MAXIMA = 30;

    private static final Pattern FORMATO =
        Pattern.compile("^[0-9]+$");

    private final JdbcTemplate jdbc;
    private final AccesoExamenDocenteServicio accesoDocente;
    private final PerfilFotoServicio fotos;

    public record EstudianteIdentificadoCodigo(
            Long idEstudiante,
            String documentoIdentidad,
            String codigoUniversitario,
            String nombreEstudiante,
            String telefono,
            boolean tieneFoto
    ) {}

    public IdentificacionCodigoControlador(
            JdbcTemplate jdbc,
            AccesoExamenDocenteServicio accesoDocente,
            PerfilFotoServicio fotos) {

        this.jdbc = jdbc;
        this.accesoDocente = accesoDocente;
        this.fotos = fotos;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public EstudianteIdentificadoCodigo identificar(
            @RequestParam String codigo) {

        accesoDocente.obtenerDocenteAutenticado();

        String codigoLimpio = validarCodigo(codigo);

        List<EstudianteIdentificadoCodigo> estudiantes =
                jdbc.query("""
                    SELECT
                        u.id_usuario,
                        u.carnet_identidad,
                        u.codigo_sis,
                        TRIM(CONCAT(u.nombre, ' ', u.apellido))
                            AS nombre_estudiante,
                        u.celular,
                        u.foto_perfil
                    FROM seguridad.usuario u
                    JOIN seguridad.rol r
                        ON r.id_rol = u.id_rol
                    WHERE u.codigo_sis = ?
                      AND u.activo = TRUE
                      AND UPPER(r.nombre_rol) = 'ESTUDIANTE'
                    LIMIT 2
                    """, (rs, fila) -> {

                    String foto =
                            rs.getString("foto_perfil");

                    return new EstudianteIdentificadoCodigo(
                            rs.getLong("id_usuario"),
                            rs.getString("carnet_identidad"),
                            rs.getString("codigo_sis"),
                            rs.getString("nombre_estudiante"),
                            rs.getString("celular"),
                            foto != null && !foto.isBlank()
                    );

                }, codigoLimpio);

        if (estudiantes.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Estudiante no encontrado"
            );
        }

        if (estudiantes.size() > 1) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Codigo universitario duplicado"
            );
        }

        return estudiantes.get(0);
    }

    @GetMapping("/{idEstudiante}/foto")
    @Transactional(readOnly = true)
    public ResponseEntity<Resource> obtenerFoto(
            @PathVariable Long idEstudiante,
            @RequestParam String codigo) {

        accesoDocente.obtenerDocenteAutenticado();

        String codigoLimpio = validarCodigo(codigo);

        if (idEstudiante == null || idEstudiante <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Identificador de estudiante invalido"
            );
        }

        Boolean coincide = jdbc.queryForObject("""
                SELECT EXISTS (
                    SELECT 1
                    FROM seguridad.usuario u
                    JOIN seguridad.rol r
                        ON r.id_rol = u.id_rol
                    WHERE u.id_usuario = ?
                      AND u.codigo_sis = ?
                      AND u.activo = TRUE
                      AND UPPER(r.nombre_rol) = 'ESTUDIANTE'
                )
                """,
                Boolean.class,
                idEstudiante,
                codigoLimpio
        );

        if (!Boolean.TRUE.equals(coincide)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Estudiante no encontrado"
            );
        }

        PerfilFotoServicio.FotoPerfil foto =
                fotos.consultar(idEstudiante);

        return ResponseEntity.ok()
                .contentType(
                        MediaType.parseMediaType(
                                foto.tipoContenido()
                        )
                )
                .cacheControl(CacheControl.noStore())
                .body(foto.recurso());
    }

    private String validarCodigo(String codigo) {

        String limpio =
                codigo == null ? "" : codigo.strip();

        if (limpio.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Debe ingresar un codigo universitario"
            );
        }

        if (limpio.length() > LONGITUD_MAXIMA
                || !FORMATO.matcher(limpio).matches()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Formato de codigo universitario invalido"
            );
        }

        return limpio;
    }
}
