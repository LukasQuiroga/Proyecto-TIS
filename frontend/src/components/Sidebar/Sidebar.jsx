import { useState } from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

function Sidebar() {
  const [estudiantesAbierto, setEstudiantesAbierto] = useState(false);
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icono">
          ◆
        </div>

        <div className="sidebar-logo-texto">
          <strong>Sistema de Control</strong>
          <span>de Ingreso a Exámenes</span>
        </div>
      </div>

      <nav className="sidebar-menu">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `sidebar-opcion ${isActive ? "sidebar-activa" : ""}`
          }
        >
          <span className="sidebar-icono">⌂</span>
          <span>Inicio</span>
        </NavLink>

        <button
          type="button"
          className="sidebar-opcion sidebar-desplegable"
          onClick={() => setEstudiantesAbierto(!estudiantesAbierto)}
        >
          <span className="sidebar-icono">♙</span>

          <span className="sidebar-texto">Estudiantes</span>

          <span className="sidebar-flecha">
            {estudiantesAbierto ? "▾" : "▸"}
          </span>
        </button>

        {estudiantesAbierto && (
          <div className="sidebar-submenu">
            <NavLink
              to="/estudiantes/registrar"
              className={({ isActive }) =>
                `sidebar-subopcion ${
                  isActive ? "sidebar-subopcion-activa" : ""
                }`
              }
            >
              Registrar
            </NavLink>

            <NavLink
              to="/estudiantes/consultar"
              className={({ isActive }) =>
                `sidebar-subopcion ${
                  isActive ? "sidebar-subopcion-activa" : ""
                }`
              }
            >
              Consultar
            </NavLink>
          </div>
        )}

        <div className="sidebar-opcion">
          <span className="sidebar-icono">▣</span>
          <span>Exámenes</span>
        </div>

        <div className="sidebar-opcion">
          <span className="sidebar-icono">▤</span>
          <span>Ambientes</span>
        </div>

        <div className="sidebar-opcion">
          <span className="sidebar-icono">▦</span>
          <span>Habilitaciones</span>
        </div>

        <div className="sidebar-opcion">
          <span className="sidebar-icono">◉</span>
          <span>Control de ingreso</span>
        </div>

        <div className="sidebar-opcion">
          <span className="sidebar-icono">▥</span>
          <span>Reportes</span>
        </div>

        <div className="sidebar-opcion">
          <span className="sidebar-icono">♙</span>
          <span>Usuarios</span>
        </div>
      </nav>
    </aside>
  );
}

export default Sidebar;