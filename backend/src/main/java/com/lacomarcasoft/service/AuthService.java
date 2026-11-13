package com.lacomarcasoft.service;

import com.lacomarcasoft.dto.request.LoginRequest;
import com.lacomarcasoft.dto.response.CarreraRespuesta;
import com.lacomarcasoft.dto.response.LoginRespuesta;
import com.lacomarcasoft.dto.response.UsuarioRespuesta;
import com.lacomarcasoft.modelo.Usuario;
import com.lacomarcasoft.repository.UsuarioRepositorio;
import com.lacomarcasoft.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuthService {

    private final UsuarioRepositorio usuarioRepositorio;
    private final JwtService jwtService;
    private final TokenSesionService tokenSesionService;
    private final PasswordEncoder passwordEncoder;
    private final PlazoFotoPerfilServicio plazoFotoPerfilServicio;

    public AuthService(
            UsuarioRepositorio usuarioRepositorio,
            JwtService jwtService,
            TokenSesionService tokenSesionService,
            PasswordEncoder passwordEncoder,
            PlazoFotoPerfilServicio plazoFotoPerfilServicio
    ) {
        this.usuarioRepositorio = usuarioRepositorio;
        this.jwtService = jwtService;
        this.tokenSesionService = tokenSesionService;
        this.passwordEncoder = passwordEncoder;
        this.plazoFotoPerfilServicio = plazoFotoPerfilServicio;
    }

    public LoginRespuesta login(LoginRequest request){

        Usuario usuario=usuarioRepositorio
            .findByCorreo(request.correo())
            .orElseThrow(
                ()->new RuntimeException(
                    "Credenciales incorrectas"
                )
            );

        if(!usuario.getActivo()){
            throw new RuntimeException(
                "Usuario inactivo"
            );
        }
        
        String contrasenaAlmacenada = usuario.getContrasena();

        boolean credencialesValidas = false;

        if (contrasenaAlmacenada != null && request.password() != null) {

            if (contrasenaAlmacenada.matches("^\\$2[aby]\\$\\d{2}\\$.*")) {
                credencialesValidas = passwordEncoder.matches(
                    request.password(),
                    contrasenaAlmacenada
                );
            } else {
                credencialesValidas = contrasenaAlmacenada.equals(
                    request.password()
                );
            }
        }

        if (!credencialesValidas) {
            throw new RuntimeException(
                "Credenciales incorrectas"
            );
        }

        plazoFotoPerfilServicio.registrarPrimerInicioYVerificar(usuario.getIdUsuario());

        String tokenId=
            jwtService.generarTokenId();

        String token=
            jwtService.generarToken(
                usuario,
                tokenId
            );

        tokenSesionService.crear(
            usuario,
            tokenId
        );

        UsuarioRespuesta respuesta=
            new UsuarioRespuesta(
                usuario.getIdUsuario(),
                usuario.getNombre(),
                usuario.getApellido(),
                usuario.getCarnetIdentidad(),
                usuario.getCorreo(),
                usuario.getCelular(),
                usuario.getCarreras() == null
                    ? List.of()
                    : usuario.getCarreras()
                        .stream()
                        .map(
                            carrera->
                                new CarreraRespuesta(
                                    carrera.getIdCarrera(),
                                    carrera.getNombre(),
                                    carrera.getFacultad().getIdFacultad(),
                                    carrera.getFacultad().getCodigo(),
                                    carrera.getFacultad().getNombre()
                                )
                        )
                        .toList(),
                usuario.getCodigoSis(),
                usuario.getRol().getIdRol(),
                usuario.getRol().getNombreRol(),
                usuario.getActivo(),
                usuario.getFechaCreacion(),
                usuario.getRol()
                    .getPermisos()
                    .stream()
                    .map(
                        permiso->
                            permiso.getNombrePermiso()
                    )
                    .toList(),
                List.of()
            );

        return new LoginRespuesta(
            token,
            respuesta
        );
    }

    public void logout(String token){

        String tokenId=
            jwtService.obtenerTokenId(token);

        tokenSesionService.cerrar(tokenId);
    }

    public List<String> obtenerPermisosActuales(Long idUsuario){
        Usuario usuario = usuarioRepositorio
                .findById(idUsuario)
                .orElseThrow(
                        () -> new RuntimeException(
                                "Usuario no encontrado"
                        )
                );
        return usuario.getRol()
                .getPermisos()
                .stream()
                .map(permiso -> permiso.getNombrePermiso())
                .toList();
    }
}