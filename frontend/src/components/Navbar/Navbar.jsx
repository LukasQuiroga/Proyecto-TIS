import "./Navbar.css";

function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-menu">
        ☰
      </div>

      <div className="navbar-usuario">
        <span className="navbar-campana">♢</span>

        <div className="navbar-avatar">
          AM
        </div>

        <span className="navbar-nombre">
          Administrador
        </span>

        <span className="navbar-flecha">
          ▾
        </span>
      </div>
    </header>
  );
}

export default Navbar;