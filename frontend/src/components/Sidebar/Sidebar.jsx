import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
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


  const [usuariosAbierto, setUsuariosAbierto] = useState(false);
  const { usuario } = useAuth();


  const tienePermiso = (permiso) => {

    return usuario?.permisos?.includes(permiso);

  };


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

          exacta

          icono="⌂"

        >

          Inicio

        </Opcion>





        {/* USUARIOS */}

        {
        (
            tienePermiso("GESTIONAR_USUARIOS") ||
            tienePermiso("IMPORTAR_USUARIOS") ||
            tienePermiso("GESTIONAR_ROLES") ||
            tienePermiso("REGISTRAR_USUARIOS")
        ) && (

        <button

          type="button"

          className="sidebar-opcion sidebar-desplegable"

          onClick={() =>
            setUsuariosAbierto(!usuariosAbierto)
          }

        >

          <span className="sidebar-icono">
            ♙
          </span>

          <span>
            Usuarios
          </span>

          <span className="sidebar-flecha">
            {usuariosAbierto ? "⌃" : "⌄"}
          </span>

        </button>

        )
        }




        {
          usuariosAbierto && (


            <div className="sidebar-submenu">



              {
              tienePermiso("GESTIONAR_USUARIOS") && (

              <NavLink

                  to="/usuarios"

                  className={({isActive}) =>
                      `sidebar-subopcion ${
                          isActive
                          ? "sidebar-subopcion-activa"
                          : ""
                      }`
                  }

              >

                  Listado de usuarios

              </NavLink>

              )
              }

              {
              tienePermiso("IMPORTAR_USUARIOS") && (

              <NavLink

                  to="/usuarios/importar"

                  className="sidebar-subopcion"

              >

                  Importar usuarios

              </NavLink>

              )
              }


              {
                tienePermiso("GESTIONAR_ROLES") && (

                  <NavLink
                    to="/usuarios/roles-permisos"
                    className={({ isActive }) =>
                      `sidebar-subopcion ${
                        isActive
                          ? "sidebar-subopcion-activa"
                          : ""
                      }`
                    }
                  >
                    Roles y permisos
                  </NavLink>

                )
              }





              {
              tienePermiso("REGISTRAR_USUARIOS") && (

              <NavLink

                  to="/usuarios/registro"

                  className="sidebar-subopcion"

              >

                  Registro manual

              </NavLink>

              )
              }



            </div>


          )
        }






        {
        tienePermiso("GESTIONAR_EXAMENES") && (

        <div className="sidebar-opcion">

            <span className="sidebar-icono">
                ▣
            </span>

            <span>
                Exámenes
            </span>

        </div>

        )
        }


        {
        tienePermiso("GESTIONAR_AMBIENTES") && (

        <div className="sidebar-opcion">

            <span className="sidebar-icono">
                ▥
            </span>

            <span>
                Ambientes
            </span>

        </div>

        )
        }


        {
        tienePermiso("GESTIONAR_HABILITACIONES") && (

        <div className="sidebar-opcion">

            <span className="sidebar-icono">
                ▦
            </span>

            <span>
                Habilitaciones
            </span>

        </div>

        )
        }

        {
        tienePermiso("VER_AUDITORIA") && (

        <Opcion
            to="/auditoria"
            icono="◎"
        >
            Auditoría
        </Opcion>

        )
        }


        {
        tienePermiso("CONTROL_INGRESO") && (

        <div className="sidebar-opcion">

            <span className="sidebar-icono">
                ◉
            </span>

            <span>
                Control de ingreso
            </span>

        </div>

        )
        }


        {
        tienePermiso("GENERAR_REPORTES") && (

        <div className="sidebar-opcion">

            <span className="sidebar-icono">
                ▥
            </span>

            <span>
                Reportes
            </span>

        </div>

        )
        }



      </nav>


    </aside>


  );

}



export default Sidebar;
