import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiChevronDown, FiLogIn, FiLogOut, FiUser } from "react-icons/fi";
import { useAuth } from "../../context/useAuth";
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
  const { usuario, cerrarSesion } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const navigate = useNavigate();

  const nombreUsuario = obtenerNombre(usuario);
  const rolUsuario = obtenerRol(usuario);

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
              {nombreUsuario.charAt(0).toUpperCase()}
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
                  onClick={()=>{
                      setMenuAbierto(false);
                      cerrarSesion();
                      navigate("/login",{replace:true});
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