package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.request.ActualizarUsuarioSolicitud;
import com.lacomarcasoft.dto.request.ImportarUsuarioFilaSolicitud;
import com.lacomarcasoft.dto.request.ImportarUsuariosSolicitud;
import com.lacomarcasoft.dto.request.RegistrarUsuarioSolicitud;
import com.lacomarcasoft.dto.response.CampoError;
import com.lacomarcasoft.dto.response.DeteccionDuplicadosRespuesta;
import com.lacomarcasoft.dto.response.FilaImportacionRespuesta;
import com.lacomarcasoft.dto.response.ImportarAnalisisRespuesta;
import com.lacomarcasoft.dto.response.ImportarMasivoRespuesta;
import com.lacomarcasoft.dto.response.MateriaRespuesta;
import com.lacomarcasoft.dto.response.UsuarioRespuesta;
import com.lacomarcasoft.exception.ValidacionRegistroException;
import com.lacomarcasoft.modelo.Rol;
import com.lacomarcasoft.modelo.Usuario;
import com.lacomarcasoft.repository.MateriaRepositorio;
import com.lacomarcasoft.repository.RolRepositorio;
import com.lacomarcasoft.repository.UsuarioRepositorio;

import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class UsuarioServicio {

    private static final int LIMITE_FILAS_IMPORTACION = 2000;

    private static final java.util.regex.Pattern EMAIL_PATRON =
            java.util.regex.Pattern.compile(
                    "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
            );

    private final UsuarioRepositorio usuarioRepositorio;
    private final RolRepositorio rolRepositorio;
    private final MateriaRepositorio materiaRepositorio;

    public UsuarioServicio(
            UsuarioRepositorio usuarioRepositorio,
            RolRepositorio rolRepositorio,
            MateriaRepositorio materiaRepositorio
    ){
        this.usuarioRepositorio = usuarioRepositorio;
        this.rolRepositorio = rolRepositorio;
        this.materiaRepositorio = materiaRepositorio;
    }

    public List<UsuarioRespuesta> listar(){

        return usuarioRepositorio.findAll()
                .stream()
                .map(this::convertirRespuesta)
                .toList();

    }

    public Usuario buscar(Long id){

        return usuarioRepositorio.findById(id)
                .orElseThrow(
                        () -> new RuntimeException(
                                "Usuario no encontrado"
                        )
                );

    }

    public boolean codigoSisDisponible(
            String codigoSis
    ){

        if(codigoSis == null || codigoSis.isBlank()){

            throw new RuntimeException(
                    "El código SIS es obligatorio"
            );

        }

        return usuarioRepositorio
                .findByCodigoSis(codigoSis)
                .isEmpty();

    }

    public DeteccionDuplicadosRespuesta detectarDuplicados(
            List<String> codigosSis
    ){

        if(codigosSis == null || codigosSis.isEmpty()){

            throw new RuntimeException(
                    "Debe enviar al menos un código SIS"
            );

        }

        List<String> codigosNormalizados =
                codigosSis.stream()
                        .map(codigo -> codigo == null ? "" : codigo.trim())
                        .filter(codigo -> !codigo.isBlank())
                        .toList();

        if(codigosNormalizados.isEmpty()){

            throw new RuntimeException(
                    "Debe enviar al menos un código SIS válido"
            );

        }

        List<String> repetidosEnEnvio =
                codigosNormalizados.stream()
                        .filter(
                                codigo ->
                                        Collections.frequency(
                                                codigosNormalizados,
                                                codigo
                                        ) > 1
                        )
                        .distinct()
                        .toList();

        List<String> codigosUnicos =
                codigosNormalizados.stream()
                        .distinct()
                        .toList();

        List<String> yaRegistrados =
                usuarioRepositorio
                        .findByCodigoSisIn(codigosUnicos)
                        .stream()
                        .map(Usuario::getCodigoSis)
                        .toList();

        return new DeteccionDuplicadosRespuesta(
                yaRegistrados,
                repetidosEnEnvio
        );

    }

    public ImportarAnalisisRespuesta analizarImportacion(
            ImportarUsuariosSolicitud solicitud
    ){

        List<FilaImportacionRespuesta> filas =
                procesarFilasImportacion(
                        solicitud,
                        false
                );

        int conErrores = 0;

        for(FilaImportacionRespuesta fila : filas){

            if(!fila.estado().equals("Activo")){

                conErrores++;

            }

        }

        return new ImportarAnalisisRespuesta(
                filas.size(),
                filas.size() - conErrores,
                conErrores,
                filas
        );

    }

    public ImportarMasivoRespuesta importarMasivo(
            ImportarUsuariosSolicitud solicitud
    ){

        List<FilaImportacionRespuesta> filas =
                procesarFilasImportacion(
                        solicitud,
                        true
                );

        int conErrores = 0;

        for(FilaImportacionRespuesta fila : filas){

            if(!fila.estado().equals("Registrado")){

                conErrores++;

            }

        }

        return new ImportarMasivoRespuesta(
                filas.size(),
                filas.size() - conErrores,
                conErrores,
                filas
        );

    }

    private List<FilaImportacionRespuesta> procesarFilasImportacion(
            ImportarUsuariosSolicitud solicitud,
            boolean persistir
    ){

        if(solicitud == null
                || solicitud.usuarios() == null
                || solicitud.usuarios().isEmpty()){

            throw new RuntimeException(
                    "Debe enviar al menos un usuario para importar"
            );

        }

        if(solicitud.usuarios().size() > LIMITE_FILAS_IMPORTACION){

            throw new RuntimeException(
                    "La importación excede el límite de "
                    + LIMITE_FILAS_IMPORTACION
                    + " usuarios por archivo"
            );

        }

        Boolean estadoPorDefecto =
                resolverEstado(
                        solicitud.estadoPorDefecto()
                );

        if(estadoPorDefecto == null){

            estadoPorDefecto = true;

        }

        List<FilaImportacionRespuesta> filas =
                new ArrayList<>();

        Map<String,Integer> correosVistos =
                new HashMap<>();

        Map<String,Integer> documentosVistos =
                new HashMap<>();

        Map<String,Integer> codigosVistos =
                new HashMap<>();

        for(ImportarUsuarioFilaSolicitud fila
                : solicitud.usuarios()){

            List<String> observaciones =
                    new ArrayList<>();

            String documento =
                    limpiar(
                            fila.documento()
                    );

            String nombres =
                    limpiar(
                            fila.nombres()
                    );

            String apellidos =
                    limpiar(
                            fila.apellidos()
                    );

            String correo =
                    limpiar(
                            fila.correo()
                    );

            String telefono =
                    limpiar(
                            fila.telefono()
                    );

            String rolTexto =
                    limpiar(
                            fila.rol()
                    );

            String estadoTexto =
                    limpiar(
                            fila.estado()
                    );

            String codigoSis =
                    limpiar(
                            fila.codigoSis()
                    );

            String carrera =
                    limpiar(
                            fila.carrera()
                    );

            String facultad =
                    limpiar(
                            fila.facultad()
                    );

            if(documento.isBlank()){

                observaciones.add(
                        "El documento de identidad es obligatorio"
                );

            } else if(!soloDigitos(documento)){

                observaciones.add(
                        "Documento inválido"
                );

            }

            if(nombres.isBlank()){

                observaciones.add(
                        "El nombre es obligatorio"
                );

            } else if(nombres.length() > 30){

                observaciones.add(
                        "El nombre no puede superar los 30 caracteres"
                );

            }

            if(apellidos.isBlank()){

                observaciones.add(
                        "El apellido es obligatorio"
                );

            } else if(apellidos.length() > 35){

                observaciones.add(
                        "El apellido no puede superar los 35 caracteres"
                );

            }

            if(correo.isBlank()){

                observaciones.add(
                        "El correo es obligatorio"
                );

            } else if(!EMAIL_PATRON.matcher(correo).matches()){

                observaciones.add(
                        "Correo electrónico inválido"
                );

            }

            if(!telefono.isBlank() && !soloDigitos(telefono)){

                observaciones.add(
                        "Teléfono inválido"
                );

            }

            Boolean estado =
                    resolverEstado(estadoTexto);

            if(estado == null){

                estado = estadoPorDefecto;

            }

            Rol rol =
                    buscarRolPorNombre(rolTexto);

            if(rolTexto.isBlank()){

                observaciones.add(
                        "Debe seleccionar un rol"
                );

            } else if(rol == null){

                observaciones.add(
                        "Rol no válido"
                );

            }

            boolean esEstudiante =
                    rol != null
                    && rolTextoSinTilde(rol.getNombreRol())
                            .equals("estudiante");

            if(esEstudiante){

                if(codigoSis.isBlank()){

                    observaciones.add(
                            "El código universitario es obligatorio"
                    );

                } else if(!soloDigitos(codigoSis)){

                    observaciones.add(
                            "Código inválido"
                    );

                }

                if(carrera.isBlank()){

                    observaciones.add(
                            "La carrera es obligatoria"
                    );

                }

            }

            if(!documento.isBlank()
                    && usuarioRepositorio
                            .findByCarnetIdentidad(documento)
                            .isPresent()){

                observaciones.add(
                        "El documento de identidad ya está registrado"
                );

            }

            if(!correo.isBlank()
                    && usuarioRepositorio
                            .findByCorreo(correo)
                            .isPresent()){

                observaciones.add(
                        "El correo ya está registrado"
                );

            }

            if(!codigoSis.isBlank()
                    && usuarioRepositorio
                            .findByCodigoSis(codigoSis)
                            .isPresent()){

                observaciones.add(
                        "El código SIS ya está registrado"
                );

            }

            if(marcarVisto(documentosVistos, documento)){

                observaciones.add(
                        "El documento se repite en el archivo"
                );

            }

            if(marcarVisto(correosVistos, correo)){

                observaciones.add(
                        "El correo se repite en el archivo"
                );

            }

            if(marcarVisto(codigosVistos, codigoSis)){

                observaciones.add(
                        "El código SIS se repite en el archivo"
                );

            }

            if(persistir && observaciones.isEmpty()){

                try {

                    Usuario usuario = new Usuario();

                    usuario.setNombre(nombres);

                    usuario.setApellido(apellidos);

                    usuario.setCarnetIdentidad(documento);

                    usuario.setCorreo(correo);

                    usuario.setContrasena(documento);

                    usuario.setCelular(
                            telefono.isBlank()
                                    ? null
                                    : telefono
                    );

                    if(esEstudiante){

                        usuario.setCodigoSis(codigoSis);

                        usuario.setCarrera(carrera);

                        usuario.setFacultad(
                                facultad.isBlank()
                                        ? null
                                        : facultad
                        );

                    }

                    usuario.setActivo(estado);

                    usuario.setRol(rol);

                    usuario.setFechaCreacion(
                            LocalDateTime.now()
                    );

                    usuarioRepositorio.save(usuario);

                    filas.add(
                            new FilaImportacionRespuesta(
                                    fila.fila(),
                                    documento,
                                    nombres,
                                    apellidos,
                                    correo,
                                    telefono,
                                    rolTexto,
                                    "Registrado",
                                    codigoSis,
                                    carrera,
                                    facultad,
                                    observaciones
                            )
                    );

                } catch (Exception e) {

                    observaciones.add(
                            "No se pudo registrar el usuario"
                    );

                    filas.add(
                            nuevaFila(
                                    fila.fila(),
                                    documento,
                                    nombres,
                                    apellidos,
                                    correo,
                                    telefono,
                                    rolTexto,
                                    codigoSis,
                                    carrera,
                                    facultad,
                                    observaciones
                            )
                    );

                }

            } else {

                filas.add(
                        nuevaFila(
                                fila.fila(),
                                documento,
                                nombres,
                                apellidos,
                                correo,
                                telefono,
                                rolTexto,
                                codigoSis,
                                carrera,
                                facultad,
                                observaciones
                        )
                );

            }

        }

        return filas;

    }

    private FilaImportacionRespuesta nuevaFila(
            int fila,
            String documento,
            String nombres,
            String apellidos,
            String correo,
            String telefono,
            String rol,
            String codigoSis,
            String carrera,
            String facultad,
            List<String> observaciones
    ){

        return new FilaImportacionRespuesta(
                fila,
                documento,
                nombres,
                apellidos,
                correo,
                telefono,
                rol,
                observaciones.isEmpty()
                        ? "Activo"
                        : "Inválido",
                codigoSis,
                carrera,
                facultad,
                observaciones
        );

    }

    private Rol buscarRolPorNombre(String nombreRol){

        if(nombreRol == null || nombreRol.isBlank()){

            return null;

        }

        String buscado =
                rolNombreNormalizado(nombreRol);

        return rolRepositorio.findAll()
                .stream()
                .filter(
                        rol ->
                                rolNombreNormalizado(
                                        rol.getNombreRol()
                                ).equals(buscado)
                )
                .findFirst()
                .orElse(null);

    }

    private String rolNombreNormalizado(String nombre){

        String resultado =
                normalizar(
                        nombre == null
                                ? ""
                                : nombre
                ).replace(" ", "");

        if(resultado.equals("personaldeingreso")){

            return "auxiliar";

        }

        return resultado;

    }

    private Boolean resolverEstado(String estado){

        if(estado == null || estado.isBlank()){

            return null;

        }

        String normalizado =
                normalizar(estado);

        if(normalizado.equals("activo")){

            return true;

        }

        if(normalizado.equals("inactivo")){

            return false;

        }

        return null;

    }

    private boolean marcarVisto(
            Map<String,Integer> vistos,
            String valor
    ){

        if(valor == null || valor.isBlank()){

            return false;

        }

        String clave = normalizar(valor);

        int veces =
                vistos.getOrDefault(clave, 0) + 1;

        vistos.put(clave, veces);

        return veces > 1;

    }

    private String rolTextoSinTilde(String texto){

        return texto == null
                ? ""
                : normalizar(texto).toLowerCase(Locale.ROOT);
    }

    private String limpiar(String valor){

        return valor == null
                ? ""
                : valor.trim();
    }

    private boolean soloDigitos(String valor){

        return valor.matches("\\d+");
    }

    private String normalizar(String texto){

        if(texto == null){

            return "";

        }

        return Normalizer
                .normalize(texto, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .trim()
                .toLowerCase(Locale.ROOT);

    }

    public UsuarioRespuesta registrar(
            RegistrarUsuarioSolicitud datos
    ){

        List<CampoError> errores =
                new ArrayList<>();

        String nombre =
                datos.nombre() == null
                        ? ""
                        : datos.nombre().trim();

        String apellido =
                datos.apellido() == null
                        ? ""
                        : datos.apellido().trim();

        String carnetIdentidad =
                datos.carnetIdentidad() == null
                        ? ""
                        : datos.carnetIdentidad().trim();

        String correo =
                datos.correo() == null
                        ? ""
                        : datos.correo().trim();

        String celular =
                datos.celular() == null
                        || datos.celular().isBlank()
                        ? null
                        : datos.celular().trim();

        if(nombre.isBlank()){

            errores.add(
                    new CampoError(
                            "nombre",
                            "El nombre es obligatorio"
                    )
            );

        }
        else if(nombre.length() > 30){

            errores.add(
                    new CampoError(
                            "nombre",
                            "El nombre no puede superar los 30 caracteres"
                    )
            );

        }

        if(apellido.isBlank()){

            errores.add(
                    new CampoError(
                            "apellido",
                            "El apellido es obligatorio"
                    )
            );

        }
        else if(apellido.length() > 35){

            errores.add(
                    new CampoError(
                            "apellido",
                            "El apellido no puede superar los 35 caracteres"
                    )
            );

        }

        if(carnetIdentidad.isBlank()){

            errores.add(
                    new CampoError(
                            "carnetIdentidad",
                            "El carnet de identidad es obligatorio"
                    )
            );

        }

        String codigoSis =
                datos.codigoSis() == null
                        ? null
                        : datos.codigoSis().trim();

        boolean codigoSisValido =
                codigoSis != null
                        && !codigoSis.isBlank();

        if(correo.isBlank()){

            errores.add(
                    new CampoError(
                            "correo",
                            "El correo es obligatorio"
                    )
            );

        } else if(usuarioRepositorio
                .findByCorreo(correo)
                .isPresent()){

            errores.add(
                    new CampoError(
                            "correo",
                            "El correo ya está registrado"
                    )
            );

        }

        if(!carnetIdentidad.isBlank()
                && usuarioRepositorio
                        .findByCarnetIdentidad(carnetIdentidad)
                        .isPresent()){

            errores.add(
                    new CampoError(
                            "carnetIdentidad",
                            "El carnet de identidad ya está registrado"
                    )
            );

        }

        if(!carnetIdentidad.isBlank()
                && !soloDigitos(carnetIdentidad)){

            errores.add(
                    new CampoError(
                            "carnetIdentidad",
                            "El documento de identidad debe contener solo números"
                    )
            );

        }

        if(celular != null
                && !soloDigitos(celular)){

            errores.add(
                    new CampoError(
                            "celular",
                            "El teléfono debe contener solo números"
                    )
            );

        }

        if(codigoSisValido
                && usuarioRepositorio.findByCodigoSis(codigoSis).isPresent()){

            errores.add(
                    new CampoError(
                            "codigoSis",
                            "El código SIS ya está registrado"
                    )
            );

        }

        if(codigoSisValido && !soloDigitos(codigoSis)){

            errores.add(
                    new CampoError(
                            "codigoSis",
                            "Código inválido"
                    )
            );

        }

        Rol rol =
                rolRepositorio.findById(datos.idRol())
                        .orElse(null);

        if(rol == null){

            errores.add(
                    new CampoError(
                            "idRol",
                            "Rol no encontrado"
                    )
            );

        }

        if(!errores.isEmpty()){

            throw new ValidacionRegistroException(
                    errores
            );

        }

        Usuario usuario = new Usuario();

        usuario.setNombre(
                nombre
        );

        usuario.setApellido(
                apellido
        );

        usuario.setCarnetIdentidad(
                carnetIdentidad
        );

        usuario.setCorreo(
                correo
        );

        String contrasena =
                datos.contrasena() == null
                        || datos.contrasena().isBlank()
                        ? carnetIdentidad
                        : datos.contrasena().trim();

        usuario.setContrasena(
                contrasena
        );

        usuario.setCelular(
                celular
        );

        if(codigoSis == null || codigoSis.isBlank()){

            usuario.setCodigoSis(
                    null
            );

        } else {

            usuario.setCodigoSis(
                    codigoSis
            );

        }

        usuario.setCarrera(
                datos.carrera()
        );

        usuario.setActivo(
                datos.activo() == null
                        ? true
                        : datos.activo()
        );

        usuario.setRol(
                rol
        );

        usuario.setFechaCreacion(
                LocalDateTime.now()
        );

        return convertirRespuesta(
                usuarioRepositorio.save(usuario)
        );

    }

    public UsuarioRespuesta buscarRespuesta(Long id){

        return convertirRespuesta(
                buscar(id)
        );

    }

    public Usuario modificar(
            Long id,
            ActualizarUsuarioSolicitud datos
    ){


        String nombre =
                datos.nombre() == null
                        ? ""
                        : datos.nombre().trim();

        String apellido =
                datos.apellido() == null
                        ? ""
                        : datos.apellido().trim();

        String carnetIdentidad =
                datos.carnetIdentidad() == null
                        ? ""
                        : datos.carnetIdentidad().trim();

        String correo =
                datos.correo() == null
                        ? ""
                        : datos.correo().trim();

        if(nombre.isBlank()){

            throw new RuntimeException(
                    "El nombre es obligatorio"
            );

        }

        if(nombre.length() > 30){

            throw new RuntimeException(
                    "El nombre no puede superar los 30 caracteres"
            );

        }


        if(apellido.isBlank()){

            throw new RuntimeException(
                    "El apellido es obligatorio"
            );

        }

        if(apellido.length() > 35){

            throw new RuntimeException(
                    "El apellido no puede superar los 35 caracteres"
            );

        }


        if(carnetIdentidad.isBlank()){

            throw new RuntimeException(
                    "El carnet de identidad es obligatorio"
            );

        }


        if(correo.isBlank()){

            throw new RuntimeException(
                    "El correo es obligatorio"
            );

        }


        Usuario usuarioExistenteCorreo =
                usuarioRepositorio.findByCorreo(
                        correo
                )
                .orElse(null);


        if(usuarioExistenteCorreo != null &&
                !usuarioExistenteCorreo.getIdUsuario().equals(id)){

            throw new RuntimeException(
                    "El correo ya está registrado"
            );

        }


        Usuario usuarioExistenteCarnet =
                usuarioRepositorio.findByCarnetIdentidad(
                        carnetIdentidad
                )
                .orElse(null);


        if(usuarioExistenteCarnet != null &&
                !usuarioExistenteCarnet.getIdUsuario().equals(id)){

            throw new RuntimeException(
                    "El carnet de identidad ya está registrado"
            );

        }

        Usuario usuario = buscar(id);

        Rol rol =
                rolRepositorio.findById(datos.idRol())
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Rol no encontrado"
                                )
                        );


        usuario.setNombre(
                nombre
        );


        usuario.setApellido(
                apellido
        );


        usuario.setCarnetIdentidad(
                carnetIdentidad
        );


        usuario.setCorreo(
                correo
        );


        usuario.setActivo(
                datos.activo()
        );


        usuario.setRol(
                rol
        );

        return usuarioRepositorio.save(usuario);

    }

    public Usuario cambiarRol(
            Long idUsuario,
            Long idRol
    ){

        Usuario usuario = buscar(idUsuario);

        Rol rol =
                rolRepositorio.findById(idRol)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Rol no encontrado"
                                )
                        );


        usuario.setRol(
                rol
        );

        return usuarioRepositorio.save(usuario);

    }

    private UsuarioRespuesta convertirRespuesta(
            Usuario usuario
    ){

        List<String> permisos =
                usuario.getRol()
                        .getPermisos()
                        .stream()
                        .map(
                                permiso ->
                                        permiso.getNombrePermiso()
                        )
                        .toList();

        List<MateriaRespuesta> materias =
                materiaRepositorio
                        .findByDocente_IdUsuarioOrderByNombreMateriaAscGrupoAsc(
                                usuario.getIdUsuario()
                        )
                        .stream()
                        .map(
                                materia ->
                                        new MateriaRespuesta(
                                                materia.getIdMateria(),
                                                materia.getNombreMateria(),
                                                materia.getGrupo()
                                        )
                        )
                        .toList();


        return new UsuarioRespuesta(

                usuario.getIdUsuario(),

                usuario.getNombre(),

                usuario.getApellido(),

                usuario.getCarnetIdentidad(),

                usuario.getCorreo(),

                usuario.getCelular(),

                usuario.getCarrera(),

                usuario.getCodigoSis(),

                usuario.getRol().getIdRol(),

                usuario.getRol().getNombreRol(),

                usuario.getActivo(),

                usuario.getFechaCreacion(),

                permisos,

                materias

        );

    }

}