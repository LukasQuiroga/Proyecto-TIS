import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../Navbar/Navbar.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";
import "./PlantillaPrincipal.css";

function PlantillaPrincipal() {
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  return (
    <div className="plantilla-pagina">
      <Sidebar
        sidebarAbierto={sidebarAbierto}
        cambiarSidebar={() => setSidebarAbierto(!sidebarAbierto)}
      />

      <div
        className={
          sidebarAbierto
            ? "plantilla-zona-principal abierto"
            : "plantilla-zona-principal cerrado"
        }
      >
        <Navbar />

        <main className="plantilla-contenido">
          <Outlet />
        </main>

        <footer className="plantilla-footer">
          <span>Sistema de Control de Ingreso a Exámenes Masivos</span>
          <span>© 2026. Todos los derechos reservados.</span>
        </footer>
      </div>
    </div>
  );
}

export default PlantillaPrincipal;