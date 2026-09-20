import "./Sidebar.css";

function Sidebar() {
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
        <div className="sidebar-opcion sidebar-activa">
          <span className="sidebar-icono">⌂</span>
          <span>Inicio</span>
        </div>

        <div className="sidebar-opcion">
          <span className="sidebar-icono">♙</span>
          <span>Estudiantes</span>
        </div>

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