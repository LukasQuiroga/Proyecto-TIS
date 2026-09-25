import { useState } from "react";
import "./RolesPermisos.css";

function RolesPermisos() {

  const [roles] = useState([]);
  const [rolSeleccionado, setRolSeleccionado] = useState(null);

  return (
    <div className="roles-permisos">

      <div className="roles-permisos-header">
        <h1>Roles y Permisos</h1>
        <p>Gestione los roles del sistema y los permisos asociados a cada uno.</p>
      </div>

      <div className="roles-permisos-tabs">
        <button className="activo">
          Roles
        </button>

        <button>
          Asignación de Roles
        </button>
      </div>

      <div className="roles-permisos-contenido">

        <section className="lista-roles">

          <div className="lista-roles-titulo">
            <h2>Lista de Roles</h2>

            <button>
              + Nuevo rol
            </button>
          </div>

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre del rol</th>
                <th>Descripción</th>
              </tr>
            </thead>

            <tbody>
              {
                roles.length > 0 ? (
                  roles.map((rol) => (
                    <tr
                      key={rol.id}
                      onClick={() => setRolSeleccionado(rol)}
                    >
                      <td>{rol.id}</td>
                      <td>{rol.nombre}</td>
                      <td>{rol.descripcion}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                        colSpan="3"
                        className="sin-datos"
                        >
                        <div>
                            <p>No existen roles registrados</p>
                            <span>
                            Los roles disponibles aparecerán cuando sean registrados en el sistema.
                            </span>
                        </div>
                        </td>
                  </tr>
                )
              }
            </tbody>
          </table>

        </section>


        <section className="panel-permisos">

          <h2>
            Permisos del rol
          </h2>

          <div className="lista-permisos">

            {
              rolSeleccionado ? (

                rolSeleccionado.permisos.map((permiso) => (
                  <label key={permiso}>
                    <input
                      type="checkbox"
                      checked
                      readOnly
                    />
                    {permiso}
                  </label>
                ))

              ) : (

                <p className="mensaje-permisos">
                  Seleccione un rol para visualizar sus permisos.
                </p>

              )
            }

          </div>


            <div className="acciones">

                <button
                    className="cancelar"
                    disabled={!rolSeleccionado}
                >
                    Cancelar
                </button>

                <button
                    className="guardar"
                    disabled={!rolSeleccionado}
                >
                    Guardar modificaciones
                </button>

            </div>

        </section>

      </div>

    </div>
  );
}

export default RolesPermisos;