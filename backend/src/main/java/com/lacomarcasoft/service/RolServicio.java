package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.request.CrearRolSolicitud;
import com.lacomarcasoft.dto.response.PermisoRespuesta;
import com.lacomarcasoft.dto.response.RolRespuesta;
import com.lacomarcasoft.modelo.Permiso;
import com.lacomarcasoft.modelo.Rol;
import com.lacomarcasoft.repository.PermisoRepositorio;
import com.lacomarcasoft.repository.RolRepositorio;
import java.util.Locale;
import java.util.Set;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;


@Service
public class RolServicio {
        private static final Set<String> PERMISOS_DOCENTE = Set.of(
                "GESTIONAR_USUARIOS",
                "GESTIONAR_MATERIAS",
                "GESTIONAR_EXAMENES",
                "GESTIONAR_HABILITACIONES",
                "CONTROL_INGRESO"
        );

        private static final Set<String> PERMISOS_CONTROL_INGRESO = Set.of(
                "CONTROL_INGRESO"
        );       
    private final RolRepositorio rolRepositorio;
    private final PermisoRepositorio permisoRepositorio;


    public RolServicio(
            RolRepositorio rolRepositorio,
            PermisoRepositorio permisoRepositorio
    ){

        this.rolRepositorio = rolRepositorio;
        this.permisoRepositorio = permisoRepositorio;

    }


    public List<RolRespuesta> listar(){

        return rolRepositorio.findAll()
                .stream()
                .map(this::convertirRespuesta)
                .toList();

    }


    public Rol buscar(Long id){

        return rolRepositorio.findById(id)
                .orElseThrow(
                        () -> new RuntimeException(
                                "Rol no encontrado"
                        )
                );

    }


    public RolRespuesta buscarRespuesta(Long id){

        return convertirRespuesta(
                buscar(id)
        );

    }    

    private RolRespuesta convertirRespuesta(
            Rol rol
    ){

        return new RolRespuesta(

                rol.getIdRol(),

                rol.getNombreRol(),

                rol.getDescripcionRol(),

                rol.getPermisos()
                        .stream()
                        .map(permiso ->
                                new PermisoRespuesta(
                                        permiso.getIdPermiso(),
                                        permiso.getNombrePermiso(),
                                        permiso.getDescripcion()
                                )
                        )
                        .toList()

        );

    }

        public Rol actualizarPermisos(
                Long idRol,
                List<Long> idsPermisos
        ) {
        Rol rol = buscar(idRol);

        String nombreRol = rol.getNombreRol()
                .trim()
                .toUpperCase(Locale.ROOT);

        if ("ADMINISTRADOR".equals(nombreRol)) {
                throw new IllegalArgumentException(
                        "No se pueden modificar los permisos del rol ADMINISTRADOR."
                );
        }

        if ("ESTUDIANTE".equals(nombreRol)) {
                throw new IllegalArgumentException(
                        "Los accesos del rol ESTUDIANTE son fijos."
                );
        }

        if (idsPermisos == null || idsPermisos.isEmpty()) {
                throw new IllegalArgumentException(
                        "Debe asignar al menos un permiso al rol."
                );
        }

        if (idsPermisos.contains(null)) {
                throw new IllegalArgumentException(
                        "Los identificadores de permisos no son válidos."
                );
        }

        List<Long> idsUnicos = idsPermisos.stream()
                .distinct()
                .toList();

        List<Permiso> permisos = permisoRepositorio.findAllById(idsUnicos);

        if (permisos.size() != idsUnicos.size()) {
                throw new IllegalArgumentException(
                        "Uno o más permisos no existen."
                );
        }

        Set<String> permitidos = switch (nombreRol) {
                case "DOCENTE" -> PERMISOS_DOCENTE;
                case "AUXILIAR", "PERSONAL DE INGRESO" -> PERMISOS_CONTROL_INGRESO;
                default -> null;
        };

        if (permitidos != null) {
                boolean tienePermisoNoPermitido = permisos.stream()
                        .anyMatch(permiso ->
                                !permitidos.contains(permiso.getNombrePermiso())
                        );

                if (tienePermisoNoPermitido) {
                throw new IllegalArgumentException(
                        "El rol no puede recibir uno o más de los permisos seleccionados."
                );
                }
        }

        rol.setPermisos(permisos);

        return rolRepositorio.save(rol);
        }

        public RolRespuesta crear(
                CrearRolSolicitud solicitud
        ){
                if(
                        solicitud.permisos() == null ||
                        solicitud.permisos().isEmpty()
                ){
                        throw new IllegalArgumentException(
                                "Debe asignar al menos un permiso al rol."
                        );
                }

                Rol rol = new Rol();
                rol.setNombreRol(
                        solicitud.nombreRol()
                );

                rol.setDescripcionRol(
                        solicitud.descripcionRol()
                );

                rol.setFechaAsignacion(
                        LocalDateTime.now()
                );

                List<Permiso> permisos =
                        permisoRepositorio.findAllById(
                                solicitud.permisos()
                        );

                rol.setPermisos(
                        permisos
                );

                Rol guardado =
                        rolRepositorio.save(rol);

                return convertirRespuesta(
                        guardado
                );

        }

}