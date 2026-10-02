package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.request.ActualizarUsuarioSolicitud;
import com.lacomarcasoft.dto.response.MateriaRespuesta;
import com.lacomarcasoft.dto.response.UsuarioRespuesta;
import com.lacomarcasoft.modelo.Rol;
import com.lacomarcasoft.modelo.Usuario;
import com.lacomarcasoft.repository.MateriaRepositorio;
import com.lacomarcasoft.repository.RolRepositorio;
import com.lacomarcasoft.repository.UsuarioRepositorio;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class UsuarioServicio {

    private final UsuarioRepositorio usuarioRepositorio;
    private final RolRepositorio rolRepositorio;
    private final MateriaRepositorio materiaRepositorio;

    public UsuarioServicio(
        UsuarioRepositorio usuarioRepositorio,
        RolRepositorio rolRepositorio,
        MateriaRepositorio materiaRepositorio
    ){
        this.usuarioRepositorio=usuarioRepositorio;
        this.rolRepositorio=rolRepositorio;
        this.materiaRepositorio=materiaRepositorio;
    }

    @Transactional(readOnly=true)
    public List<UsuarioRespuesta> listar(){
        return usuarioRepositorio.findAll()
            .stream()
            .map(this::convertirRespuesta)
            .toList();
    }

    @Transactional(readOnly=true)
    public Usuario buscar(Long id){
        return usuarioRepositorio.findById(id)
            .orElseThrow(
                ()->new RuntimeException("Usuario no encontrado")
            );
    }

    @Transactional(readOnly=true)
    public UsuarioRespuesta buscarRespuesta(Long id){
        return convertirRespuesta(buscar(id));
    }

    @Transactional
    public Usuario modificar(
        Long id,
        ActualizarUsuarioSolicitud datos
    ){
        validarDatos(datos);

        Usuario usuario=buscar(id);

        Usuario usuarioCorreo=
            usuarioRepositorio.findByCorreo(datos.correo().trim())
                .orElse(null);

        if(usuarioCorreo!=null &&
            !usuarioCorreo.getIdUsuario().equals(id)){
            throw new RuntimeException(
                "El correo ya está registrado"
            );
        }

        Usuario usuarioCarnet=
            usuarioRepositorio
                .findByCarnetIdentidad(datos.carnetIdentidad().trim())
                .orElse(null);

        if(usuarioCarnet!=null &&
            !usuarioCarnet.getIdUsuario().equals(id)){
            throw new RuntimeException(
                "El carnet de identidad ya está registrado"
            );
        }

        String codigoSis=normalizarOpcional(datos.codigoSis());

        if(codigoSis!=null){
            Usuario usuarioCodigo=
                usuarioRepositorio.findByCodigoSis(codigoSis)
                    .orElse(null);

            if(usuarioCodigo!=null &&
                !usuarioCodigo.getIdUsuario().equals(id)){
                throw new RuntimeException(
                    "El código SIS ya está registrado"
                );
            }
        }

        Rol rol=rolRepositorio.findById(datos.idRol())
            .orElseThrow(
                ()->new RuntimeException("Rol no encontrado")
            );

        usuario.setNombre(datos.nombre().trim());
        usuario.setApellido(datos.apellido().trim());
        usuario.setCarnetIdentidad(
            datos.carnetIdentidad().trim()
        );
        usuario.setCorreo(
            datos.correo().trim().toLowerCase()
        );
        usuario.setCelular(
            normalizarOpcional(datos.celular())
        );
        usuario.setCarrera(
            normalizarOpcional(datos.carrera())
        );
        usuario.setCodigoSis(codigoSis);
        usuario.setActivo(
            datos.activo()!=null ? datos.activo() : true
        );
        usuario.setRol(rol);

        return usuarioRepositorio.save(usuario);
    }

    @Transactional
    public Usuario cambiarRol(
        Long idUsuario,
        Long idRol
    ){
        if(idRol==null){
            throw new RuntimeException(
                "El rol es obligatorio"
            );
        }

        Usuario usuario=buscar(idUsuario);

        Rol rol=rolRepositorio.findById(idRol)
            .orElseThrow(
                ()->new RuntimeException("Rol no encontrado")
            );

        usuario.setRol(rol);

        return usuarioRepositorio.save(usuario);
    }

    private void validarDatos(
        ActualizarUsuarioSolicitud datos
    ){
        if(datos.nombre()==null ||
            datos.nombre().isBlank()){
            throw new RuntimeException(
                "El nombre es obligatorio"
            );
        }

        if(datos.apellido()==null ||
            datos.apellido().isBlank()){
            throw new RuntimeException(
                "El apellido es obligatorio"
            );
        }

        if(datos.carnetIdentidad()==null ||
            datos.carnetIdentidad().isBlank()){
            throw new RuntimeException(
                "El carnet de identidad es obligatorio"
            );
        }

        if(!datos.carnetIdentidad()
            .trim()
            .matches("[0-9]+")){
            throw new RuntimeException(
                "El carnet de identidad solo debe contener números"
            );
        }

        if(datos.correo()==null ||
            datos.correo().isBlank()){
            throw new RuntimeException(
                "El correo es obligatorio"
            );
        }

        if(!datos.correo()
            .trim()
            .matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")){
            throw new RuntimeException(
                "El correo no tiene un formato válido"
            );
        }

        if(datos.idRol()==null){
            throw new RuntimeException(
                "El rol es obligatorio"
            );
        }
    }

    private String normalizarOpcional(String valor){
        if(valor==null){
            return null;
        }

        String limpio=valor.trim();

        return limpio.isEmpty() ? null : limpio;
    }

    private UsuarioRespuesta convertirRespuesta(
        Usuario usuario
    ){
        List<String> permisos=
            usuario.getRol()
                .getPermisos()
                .stream()
                .map(
                    permiso->permiso.getNombrePermiso()
                )
                .toList();

        List<MateriaRespuesta> materias=
            materiaRepositorio
                .findByDocente_IdUsuarioOrderByNombreMateriaAscGrupoAsc(
                    usuario.getIdUsuario()
                )
                .stream()
                .map(
                    materia->new MateriaRespuesta(
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