package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.request.RegistrarAsignaturaSolicitud;
import com.lacomarcasoft.dto.response.AsignaturaRespuesta;
import com.lacomarcasoft.modelo.Asignatura;
import com.lacomarcasoft.modelo.AsignaturaCarrera;
import com.lacomarcasoft.repository.AsignaturaRepositorio;
import com.lacomarcasoft.repository.AsignaturaCarreraRepositorio;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.lacomarcasoft.dto.response.GrupoAsignaturaRespuesta;
import com.lacomarcasoft.modelo.Usuario;
import com.lacomarcasoft.repository.MateriaRepositorio;
import com.lacomarcasoft.dto.response.DocenteRespuesta;
import com.lacomarcasoft.repository.UsuarioRepositorio;
import com.lacomarcasoft.modelo.Materia;
import com.lacomarcasoft.modelo.Carrera;
import com.lacomarcasoft.repository.CarreraRepositorio;
import com.lacomarcasoft.repository.FacultadRepositorio;
import com.lacomarcasoft.dto.response.DocentesPorFacultadRespuesta;
import java.util.HashSet;
import java.util.Set;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class AsignaturaServicio {

    private final AsignaturaRepositorio asignaturaRepositorio;
    private final AsignaturaCarreraRepositorio asignaturaCarreraRepositorio;
    private final MateriaRepositorio materiaRepositorio;
    private final UsuarioRepositorio usuarioRepositorio;
    private final CarreraRepositorio carreraRepositorio;
    private final FacultadRepositorio facultadRepositorio;

    public AsignaturaServicio(
            AsignaturaRepositorio asignaturaRepositorio,
            AsignaturaCarreraRepositorio asignaturaCarreraRepositorio,
            MateriaRepositorio materiaRepositorio,
            UsuarioRepositorio usuarioRepositorio,
            CarreraRepositorio carreraRepositorio,
            FacultadRepositorio facultadRepositorio
    ) {
        this.asignaturaRepositorio = asignaturaRepositorio;
        this.asignaturaCarreraRepositorio = asignaturaCarreraRepositorio;
        this.materiaRepositorio = materiaRepositorio;
        this.usuarioRepositorio = usuarioRepositorio;
        this.carreraRepositorio = carreraRepositorio;
        this.facultadRepositorio = facultadRepositorio;
    }

    @Transactional
    public AsignaturaRespuesta registrar(
            RegistrarAsignaturaSolicitud solicitud
    ) {

        if (solicitud == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Los datos de la asignatura son obligatorios"
            );
        }

        String codigo = limpiar(solicitud.codigoAsignatura());
        String nombre = limpiar(solicitud.nombreAsignatura());

        if (codigo.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El codigo es obligatorio"
            );
        }

        if (codigo.length() > 30 ||
                !codigo.matches("[A-Za-z0-9_-]+")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El codigo contiene caracteres no permitidos o supera 30 caracteres"
            );
        }

        if (nombre.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El nombre de la asignatura es obligatorio"
            );
        }

        if (nombre.length() < 3 || nombre.length() > 120) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El nombre debe tener entre 3 y 120 caracteres"
            );
        }

        Short semestre = solicitud.semestre();

        if (semestre == null || semestre < 1 || semestre > 10) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El semestre debe estar entre 1 y 10"
            );
        }

        List<String> carreras = normalizarCarreras(
                solicitud.carreras()
        );
        validarCarrerasFacultad(solicitud.idFacultad(), carreras);

        Long idDocente = solicitud.idDocente();

        if (idDocente == null || idDocente <= 0) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Debe seleccionar un docente válido"
        );
        }

        Usuario docente = usuarioRepositorio.bloquearDocente(idDocente)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "El docente seleccionado no existe"
                ));

        if (!Boolean.TRUE.equals(docente.getActivo())
                || docente.getRol() == null
                || !"DOCENTE".equalsIgnoreCase(
                        docente.getRol().getNombreRol()
                )) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "El usuario seleccionado no es un docente activo"
        );
        }

        validarFacultadDocente(idDocente, solicitud.idFacultad());

        String grupo = solicitud.grupo() == null
                ? ""
                : solicitud.grupo().trim().toUpperCase(Locale.ROOT);

        if (!grupo.matches("[A-Z0-9]{1,20}")) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "El grupo debe contener entre 1 y 20 letras o números, sin espacios"
        );
        }

        if (asignaturaRepositorio.existeCodigo(codigo)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ya existe una asignatura con el codigo " + codigo
            );
        }

        if (asignaturaRepositorio.existeNombre(nombre)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ya existe una asignatura con el nombre " + nombre
            );
        }

        Asignatura asignatura = new Asignatura();

        asignatura.setCodigoAsignatura(codigo);
        asignatura.setNombreAsignatura(nombre);
        asignatura.setSemestre(semestre);

        asignatura.setActivo(
                solicitud.activo() == null
                        ? true
                        : solicitud.activo()
        );

        String descripcion = limpiar(solicitud.descripcion());

        asignatura.setDescripcion(
                descripcion.isBlank() ? null : descripcion
        );

        Asignatura guardada = asignaturaRepositorio.save(
                asignatura
        );

        List<AsignaturaCarrera> relaciones = new ArrayList<>();

        for (String carrera : carreras) {
            relaciones.add(
                    new AsignaturaCarrera(
                            guardada.getIdAsignatura(),
                            carrera
                    )
            );
        }

        asignaturaCarreraRepositorio.saveAll(relaciones);

        Materia materia = new Materia();

        materia.setAsignatura(guardada);
        materia.setDocente(docente);
        materia.setGrupo(grupo);

        materiaRepositorio.save(materia);

        return new AsignaturaRespuesta(
                guardada.getIdAsignatura(),
                guardada.getCodigoAsignatura(),
                guardada.getNombreAsignatura(),
                guardada.getSemestre(),
                guardada.getActivo(),
                guardada.getDescripcion(),
                carreras
        );
    }

    @Transactional(readOnly = true)
    public List<AsignaturaRespuesta> listar(String buscar) {

        List<Asignatura> asignaturas;

        if (buscar == null || buscar.isBlank()) {

            asignaturas = asignaturaRepositorio
                    .findAllByOrderByNombreAsignaturaAsc();

        } else {

            asignaturas = asignaturaRepositorio
                    .buscarPorCodigoONombre(buscar.trim());

        }

        return asignaturas.stream()
                .map(this::convertirRespuesta)
                .toList();
    }


    @Transactional(readOnly = true)
    public AsignaturaRespuesta obtenerPorId(Long id) {

        Asignatura asignatura = asignaturaRepositorio
                .findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Asignatura no encontrada"
                        )
                );

        return convertirRespuesta(asignatura);
    }


    private AsignaturaRespuesta convertirRespuesta(
            Asignatura asignatura
    ) {

        List<String> carreras = asignaturaCarreraRepositorio
                .findByIdAsignatura(asignatura.getIdAsignatura())
                .stream()
                .map(AsignaturaCarrera::getCarrera)
                .sorted(String.CASE_INSENSITIVE_ORDER)
                .toList();

        return new AsignaturaRespuesta(
                asignatura.getIdAsignatura(),
                asignatura.getCodigoAsignatura(),
                asignatura.getNombreAsignatura(),
                asignatura.getSemestre(),
                asignatura.getActivo(),
                asignatura.getDescripcion(),
                carreras
        );
    }

    @Transactional(readOnly = true)
        public List<DocenteRespuesta> listarDocentesActivos() {

        return usuarioRepositorio
                .listarDocentesActivos()
                .stream()
                .map(docente -> new DocenteRespuesta(
                        docente.getIdUsuario(),
                        (
                                docente.getNombre() + " " +
                                docente.getApellido()
                        ).trim()
                ))
                .toList();
        }

    @Transactional(readOnly = true)
        public DocentesPorFacultadRespuesta listarDocentesPorFacultad(Long idFacultad) {

        if (idFacultad == null || !facultadRepositorio.existsById(idFacultad)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "La facultad seleccionada no existe"
                );
        }

        List<DocenteRespuesta> docentesFacultad = new ArrayList<>();
        List<DocenteRespuesta> docentesSinFacultad = new ArrayList<>();

        for (Usuario docente : usuarioRepositorio.listarDocentesActivos()) {
                List<Materia> materias = materiaRepositorio.listarPorDocente(
                        docente.getIdUsuario()
                );

                DocenteRespuesta respuesta = new DocenteRespuesta(
                        docente.getIdUsuario(),
                        (docente.getNombre() + " " + docente.getApellido()).trim()
                );

                if (materias.isEmpty()) {
                        docentesSinFacultad.add(respuesta);
                        continue;
                }

                Set<Long> facultadesDocente;

                try {
                        facultadesDocente = obtenerFacultadesDocente(
                                docente.getIdUsuario()
                        );
                } catch (ResponseStatusException ex) {
                        continue;
                }

                if (facultadesDocente.size() == 1
                        && facultadesDocente.contains(idFacultad)) {
                        docentesFacultad.add(respuesta);
                }
                }

        return new DocentesPorFacultadRespuesta(
                docentesFacultad,
                docentesSinFacultad
        );
    }
    
    @Transactional(readOnly = true)
        public List<GrupoAsignaturaRespuesta> listarGrupos(
                Long idAsignatura
        ) {
        if (!asignaturaRepositorio.existsById(idAsignatura)) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Asignatura no encontrada"
                );
        }

        return materiaRepositorio
                .listarPorAsignatura(idAsignatura)
                .stream()
                .map(materia -> {
                        Usuario docente = materia.getDocente();

                        String nombreCompleto = (
                                docente.getNombre() + " " +
                                docente.getApellido()
                        ).trim();

                        return new GrupoAsignaturaRespuesta(
                                materia.getIdMateria(),
                                materia.getGrupo(),
                                docente.getIdUsuario(),
                                nombreCompleto
                        );
                })
                .toList();
    }

    private String limpiar(String valor) {
        return valor == null ? "" : valor.trim();
    }

    private List<String> normalizarCarreras(List<String> carreras) {

        if (carreras == null || carreras.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Debe seleccionar al menos una carrera"
            );
        }

        Map<String, String> unicas = new LinkedHashMap<>();

        for (String valor : carreras) {

            String carrera = limpiar(valor);

            if (carrera.isBlank()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "La carrera no puede estar vacia"
                );
            }

            if (carrera.length() > 120) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "El nombre de la carrera no puede superar 120 caracteres"
                );
            }

            String clave = carrera.toLowerCase(Locale.ROOT);

            if (unicas.containsKey(clave)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "La carrera " + carrera + " esta repetida"
                );
            }

            unicas.put(clave, carrera);
        }

        return new ArrayList<>(unicas.values());
    }

    private void validarCarrerasFacultad(
                Long idFacultad,
                List<String> nombresCarreras
        ) {
        if (idFacultad == null || !facultadRepositorio.existsById(idFacultad)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "La facultad seleccionada no existe"
                );
        }

        List<Carrera> carreras = carreraRepositorio.findByNombreIn(nombresCarreras);

        if (carreras.size() != nombresCarreras.size()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Una o más carreras no existen en el catálogo"
                );
        }

        boolean facultadIncorrecta = carreras.stream()
                .anyMatch(carrera ->
                        !carrera.getFacultad().getIdFacultad().equals(idFacultad)
                );

        if (facultadIncorrecta) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Todas las carreras deben pertenecer a la facultad seleccionada"
                );
        }
   }


        private void validarFacultadDocente(
                Long idDocente,
                Long idFacultad
        ) {
                Set<Long> facultades = obtenerFacultadesDocente(idDocente);

                if (facultades.size() > 1) {
                        throw new ResponseStatusException(
                                HttpStatus.CONFLICT,
                                "El docente tiene asignaturas de diferentes facultades"
                        );
                }

                if (!facultades.isEmpty() && !facultades.contains(idFacultad)) {
                        throw new ResponseStatusException(
                                HttpStatus.CONFLICT,
                                "El docente ya tiene asignaturas asociadas a otra facultad"
                        );
                }
        }

        private Set<Long> obtenerFacultadesDocente(Long idDocente) {
                Set<Long> facultades = new HashSet<>();

                List<Materia> materias = materiaRepositorio.listarPorDocente(idDocente);

                for (Materia materia : materias) {
                        Long idAsignatura = materia.getAsignatura().getIdAsignatura();

                        List<String> nombresCarreras = asignaturaCarreraRepositorio
                                .findByIdAsignatura(idAsignatura)
                                .stream()
                                .map(AsignaturaCarrera::getCarrera)
                                .toList();

                        if (nombresCarreras.isEmpty()) {
                        continue;
                        }

                        List<Carrera> carreras = carreraRepositorio.findByNombreIn(nombresCarreras);

                        if (carreras.size() != nombresCarreras.size()) {
                        throw new ResponseStatusException(
                                HttpStatus.CONFLICT,
                                "Una asignatura del docente tiene carreras no reconocidas"
                        );
                        }

                        Set<Long> facultadesAsignatura = new HashSet<>();

                        for (Carrera carrera : carreras) {
                        facultadesAsignatura.add(carrera.getFacultad().getIdFacultad());
                        }

                        if (facultadesAsignatura.size() != 1) {
                        throw new ResponseStatusException(
                                HttpStatus.CONFLICT,
                                "Una asignatura del docente pertenece a varias facultades"
                        );
                        }

                        facultades.addAll(facultadesAsignatura);
                }

                return facultades;
        }
}