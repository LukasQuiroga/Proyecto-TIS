import { useState } from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";


function Opcion({
  to,
  icono,
  children,
  exacta = false
}) {

  return (
    <NavLink
      to={to}
      end={exacta}
      className={({ isActive }) =>
        `sidebar-opcion sidebar-opcion-enlace ${
          isActive ? "sidebar-activa" : ""
        }`
      }
    >

      <span className="sidebar-icono">
        {icono}
      </span>

      <span>
        {children}
      </span>

    </NavLink>
  );
}



function Sidebar() {

  const [estudiantesAbierto, setEstudiantesAbierto] = useState(false);


  return (

    <aside className="sidebar">


      <div className="sidebar-logo">

        <div className="sidebar-logo-icono">
          ◆
        </div>


        <div className="sidebar-logo-texto">

          <strong>
            Sistema de Control
          </strong>

          <span>
            de Ingreso a Exámenes
          </span>

        </div>

      </div>



      <nav className="sidebar-menu">


        <Opcion
          to="/"
          icono="⌂"
          exacta
        >
          Inicio
        </Opcion>



        <button
          type="button"
          className="sidebar-opcion sidebar-desplegable"
          onClick={() =>
            setEstudiantesAbierto(!estudiantesAbierto)
          }
        >

          <span className="sidebar-icono">
            ♙
          </span>


          <span>
            Estudiantes
          </span>


          <span className="sidebar-flecha">

            {
              estudiantesAbierto
                ? "▾"
                : "▸"
            }

          </span>


        </button>



        {
          estudiantesAbierto && (

            <div className="sidebar-submenu">


              <NavLink
                to="/estudiantes/registrar"
                className={({isActive}) =>
                  `sidebar-subopcion ${
                    isActive
                      ? "sidebar-subopcion-activa"
                      : ""
                  }`
                }
              >
                Registrar
              </NavLink>



              <NavLink
                to="/estudiantes/consultar"
                className={({isActive}) =>
                  `sidebar-subopcion ${
                    isActive
                      ? "sidebar-subopcion-activa"
                      : ""
                  }`
                }
              >
                Consultar
              </NavLink>


            </div>

          )
        }



        <div className="sidebar-opcion">

          <span className="sidebar-icono">
            ▣
          </span>

          <span>
            Exámenes
          </span>

        </div>



        <div className="sidebar-opcion">

          <span className="sidebar-icono">
            ▤
          </span>

          <span>
            Ambientes
          </span>

        </div>



        <div className="sidebar-opcion">

          <span className="sidebar-icono">
            ▦
          </span>

          <span>
            Habilitaciones
          </span>

        </div>



        <div className="sidebar-opcion">

          <span className="sidebar-icono">
            ◉
          </span>

          <span>
            Control de ingreso
          </span>

        </div>



        <div className="sidebar-opcion">

          <span className="sidebar-icono">
            ▥
          </span>

          <span>
            Reportes
          </span>

        </div>



        <div className="sidebar-opcion">

          <span className="sidebar-icono">
            ♙
          </span>

          <span>
            Usuarios
          </span>

        </div>



        <Opcion
          to="/auditoria"
          icono="◎"
        >
          Auditoría
        </Opcion>


      </nav>


    </aside>

  );
}


export default Sidebar;