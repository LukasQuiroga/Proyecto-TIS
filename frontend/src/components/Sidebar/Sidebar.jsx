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


  const [usuariosAbierto, setUsuariosAbierto] = useState(false);



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




        {
          usuariosAbierto && (


            <div className="sidebar-submenu">



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




              <NavLink

                to="/usuarios/importar"

                className="sidebar-subopcion"

              >

                Importar usuarios


              </NavLink>





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





              <NavLink

                to="/usuarios/registro"

                className="sidebar-subopcion"

              >

                Registro manual


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

            ▥

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



<Opcion
          to="/auditoria"
          icono="◎"
        >
          Auditoría
        </Opcion>




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










      </nav>


    </aside>


  );

}



export default Sidebar;
