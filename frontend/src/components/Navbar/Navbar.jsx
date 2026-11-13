import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiChevronDown, FiLogIn, FiLogOut, FiUser } from "react-icons/fi";
import { useAuth } from "../../context/useAuth";
import {
    cerrarSesionBackend
} from "../../services/authService";
import { obtenerFotoPerfil } from "../../services/perfilService";
import "./Navbar.css";

function obtenerNombre(usuario) {
  return usuario?.nombre || usuario?.nombreCompleto || "Usuario";
}

function obtenerRol(usuario) {
  if (!usuario) return "";

  if (usuario.nombreRol) return usuario.nombreRol;
  if (usuario.rol?.nombreRol) return usuario.rol.nombreRol;
  if (usuario.rol?.nombre) return usuario.rol.nombre;
  if (typeof usuario.rol === "string") return usuario.rol;

  if (Array.isArray(usuario.roles) && usuario.roles.length > 0) {
    return (
      usuario.roles[0].nombreRol ||
      usuario.roles[0].nombre ||
      "Sin rol"
    );
  }

  return "Sin rol";
}

function Navbar() {
  const { usuario, token, cerrarSesion } = useAuth();
  const [fotoPerfilUrl, setFotoPerfilUrl] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const nombreUsuario = obtenerNombre(usuario);
  const rolUsuario = obtenerRol(usuario);
  const idUsuario = usuario?.idUsuario;
  const hayUsuario = Boolean(usuario);

  useEffect(() => {
    if (!hayUsuario || !token) return undefined;

    let activo = true;
    let urlActual = null;
    let solicitud = 0;

    const cargarFoto = async () => {
      const numeroSolicitud = ++solicitud;

      try {
        const imagen = await obtenerFotoPerfil();
        if (!activo || numeroSolicitud !== solicitud) return;

        const nuevaUrl = URL.createObjectURL(imagen);
        if (urlActual) URL.revokeObjectURL(urlActual);
        urlActual = nuevaUrl;
        setFotoPerfilUrl(nuevaUrl);
      } catch {
        if (!activo || numeroSolicitud !== solicitud) return;
        if (urlActual) URL.revokeObjectURL(urlActual);
        urlActual = null;
        setFotoPerfilUrl(null);
      }
    };

    const actualizarFoto = () => {
      cargarFoto();
    };

    cargarFoto();
    window.addEventListener("perfil-foto-actualizada", actualizarFoto);

    return () => {
      activo = false;
      solicitud++;
      window.removeEventListener("perfil-foto-actualizada", actualizarFoto);
      if (urlActual) URL.revokeObjectURL(urlActual);
    };
  }, [hayUsuario, idUsuario, token, location.pathname]);

  return (
    <header className="navbar">
      {usuario ? (
        <div className="navbar-usuario-wrap">
          <button
            type="button"
            className="navbar-usuario"
            onClick={() => setMenuAbierto(!menuAbierto)}
          >
            <div className="navbar-avatar">
              {fotoPerfilUrl ? (
                <img
                  src={fotoPerfilUrl}
                  alt="Foto de perfil"
                  className="navbar-avatar-imagen"
                />
              ) : (
                nombreUsuario.charAt(0).toUpperCase()
              )}
            </div>

            <div className="navbar-usuario-texto">
              <strong>{nombreUsuario}</strong>
              <span>{rolUsuario}</span>
            </div>

            <FiChevronDown className="navbar-flecha" />
          </button>

          {menuAbierto && (
            <div className="navbar-dropdown">
              <button
                type="button"
                onClick={() => {
                  setMenuAbierto(false);
                  navigate("/perfil");
                }}
              >
                <FiUser />
                Ver perfil
              </button>

              <button
                  type="button"
                  onClick={async()=>{

                      setMenuAbierto(false);

                      try{
                          await cerrarSesionBackend();
                      }catch{
                          // Se cierra localmente aunque falle backend.
                      }

                      setFotoPerfilUrl(null);
                      cerrarSesion();

                      navigate(
                          "/",
                          {replace:true}
                      );
                  }}
              >
                  <FiLogOut/>
                  Cerrar sesión
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          className="navbar-login"
          onClick={() => navigate("/login")}
        >
          <FiLogIn />
          <span>Iniciar sesión</span>
        </button>
      )}
    </header>
  );
}

export default Navbar;