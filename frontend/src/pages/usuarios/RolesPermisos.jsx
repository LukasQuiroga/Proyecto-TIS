import { useEffect, useState } from "react";
import "./RolesPermisos.css";
import { obtenerRoles, obtenerPermisos, actualizarPermisosRol,
  crearRol as crearRolServicio
} from "../../services/rolService";

function RolesPermisos() {

    const [roles, setRoles] = useState([]);
    const [rolSeleccionado, setRolSeleccionado] = useState(null);
    const [permisos, setPermisos] = useState([]);
    const [permisosSeleccionados, setPermisosSeleccionados] = useState([]);

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const [
                    respuestaRoles,
                    respuestaPermisos
                ] = await Promise.all([
                    obtenerRoles(),
                    obtenerPermisos()
                ]);


                setPermisos(
                    respuestaPermisos.data
                );


                const rolesAdaptados = respuestaRoles.data.map((rol) => ({
                    id: rol.idRol,
                    nombre: rol.nombreRol,
                    descripcion: rol.descripcionRol,
                    permisos: rol.permisos || []
                }));

                setRoles(rolesAdaptados);
            } catch(error) {
                console.error(
                    "Error al cargar roles:",
                    error
                );
            }
        };
        cargarDatos();

    }, []);


    const [modalNuevoRol, setModalNuevoRol] = useState(false);

    const [nuevoRol, setNuevoRol] = useState({
    nombre: "",
    descripcion: "",
    permisos: []
    });

    const [procesandoCrearRol, setProcesandoCrearRol] = useState(false);

    const [mostrarExito, setMostrarExito] = useState(false);
    const [guardandoPermisos, setGuardandoPermisos] = useState(false);
    const [mostrarExitoPermisos, setMostrarExitoPermisos] = useState(false);

    const abrirModalNuevoRol = () => {

    setNuevoRol({
        nombre: "",
        descripcion: "",
        permisos: []
    });

    setModalNuevoRol(true);

    };


    const cerrarModalNuevoRol = () => {

    setModalNuevoRol(false);

    };


    const cambiarPermisoNuevoRol = (permiso) => {

    const permisosActualizados =
            nuevoRol.permisos.includes(
                permiso.idPermiso
            )

            ?
            nuevoRol.permisos.filter(
                (item) =>
                item !== permiso.idPermiso
            )

            :
            [
                ...nuevoRol.permisos,
                permiso.idPermiso
            ];
        setNuevoRol({
            ...nuevoRol,
            permisos: permisosActualizados
        });
    };


    const crearRol = async () => {
        try {
            setProcesandoCrearRol(true);

            const respuesta = await crearRolServicio({

                nombreRol: nuevoRol.nombre,
                descripcionRol: nuevoRol.descripcion,
                permisos: nuevoRol.permisos

            });

            const rolCreado = {

                id: respuesta.data.idRol,
                nombre: respuesta.data.nombreRol,
                descripcion: respuesta.data.descripcionRol,
                permisos: respuesta.data.permisos

            };

            setRoles([
                ...roles,
                rolCreado
            ]);

            setMostrarExito(true);
            cerrarModalNuevoRol();

        } catch(error) {

            console.error(
                "Error creando rol:",
                error
            );

        } finally {
            setProcesandoCrearRol(false);
        }

    };

    const guardarPermisos = async () => {

        try {
            setGuardandoPermisos(true);
            await actualizarPermisosRol(
                rolSeleccionado.id,
                permisosSeleccionados
            );

            const respuesta = await obtenerRoles();

            const rolesAdaptados = respuesta.data.map((rol) => ({
                id: rol.idRol,
                nombre: rol.nombreRol,
                descripcion: rol.descripcionRol,
                permisos: rol.permisos || []
            }));

            setRoles(rolesAdaptados);

            const rolActualizado =
                rolesAdaptados.find(
                    rol =>
                    rol.id === rolSeleccionado.id
                );

            setRolSeleccionado(
                rolActualizado
            );
            setMostrarExitoPermisos(true);

        } catch(error) {

            console.error(
                "Error actualizando permisos:",
                error
            );

        } finally {
            setGuardandoPermisos(false);
        }

    };
    
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

            <button
            onClick={abrirModalNuevoRol}
            >
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
                      onClick={() => {

                          setRolSeleccionado(rol);
                          setPermisosSeleccionados(
                              rol.permisos.map(
                                  permiso => permiso.idPermiso
                              )
                          );
                      }}
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

                permisos.map((permiso) => (

                  <label
                    key={permiso.idPermiso}
                  >

                    <input
                        type="checkbox"
                        checked={
                            permisosSeleccionados.includes(
                                permiso.idPermiso
                            )
                        }
                        onChange={() => {

                            if(
                                permisosSeleccionados.includes(
                                    permiso.idPermiso
                                )
                            ){

                                setPermisosSeleccionados(
                                    permisosSeleccionados.filter(
                                        id => id !== permiso.idPermiso
                                    )
                                );

                            }else{

                                setPermisosSeleccionados([
                                    ...permisosSeleccionados,
                                    permiso.idPermiso
                                ]);

                            }

                        }}
                    />
                    {permiso.nombrePermiso}
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
                    disabled={
                        !rolSeleccionado ||
                        guardandoPermisos
                    }
                    onClick={guardarPermisos}
                >
                    {
                        guardandoPermisos
                        ? "Guardando..."
                        : "Guardar modificaciones"
                    }
                </button>

            </div>

        </section>

      </div>

      {
        modalNuevoRol && (

          <div className="modal-fondo">

            <div className="modal-contenedor">

              <h2>
                Crear nuevo rol
              </h2>


              <div className="modal-campo">

                <label>
                  Nombre del rol
                </label>

                <input
                  type="text"
                  value={nuevoRol.nombre}
                  onChange={(e) =>
                    setNuevoRol({
                      ...nuevoRol,
                      nombre: e.target.value
                    })
                  }
                />

              </div>


              <div className="modal-campo">

                <label>
                  Descripción
                </label>

                <textarea
                  value={nuevoRol.descripcion}
                  onChange={(e) =>
                    setNuevoRol({
                      ...nuevoRol,
                      descripcion: e.target.value
                    })
                  }
                />

              </div>


              <div className="modal-permisos">

                <label>
                  Permisos
                </label>

                {
                  permisos.map((permiso) => (

                    <label
                      key={permiso.idPermiso}
                      className="permiso-checkbox"
                    >

                      <input
                        type="checkbox"
                        checked={
                            nuevoRol.permisos.includes(
                               permiso.idPermiso
                            )
                        }
                        onChange={() =>
                          cambiarPermisoNuevoRol(permiso)
                        }
                      />

                      {permiso.nombrePermiso}

                    </label>

                  ))
                }

              </div>


              <div className="modal-acciones">

                <button
                  className="cancelar"
                  onClick={cerrarModalNuevoRol}
                >
                  Cancelar
                </button>


                <button
                    className="guardar"
                    onClick={crearRol}
                    disabled={
                        procesandoCrearRol ||
                        !nuevoRol.nombre ||
                        !nuevoRol.descripcion
                    }
                    >
                    {
                        procesandoCrearRol
                        ? "Creando..."
                        : "Crear rol"
                    }
                    </button>

              </div>

            </div>

          </div>

        )     
      }

      {
        mostrarExito && (

            <div className="modal-fondo">

            <div className="modal-exito">

                <div className="icono-exito">
                    ✓
                </div>

                <h2>
                    Registro exitoso
                </h2>

                <button
                    className="guardar"
                    onClick={() => setMostrarExito(false)}
                    >
                    Aceptar
                </button>

            </div>

            </div>

        )
       }
       {
            mostrarExitoPermisos && (

                <div className="modal-fondo">

                    <div className="modal-exito">

                        <div className="icono-exito">
                            ✓
                        </div>


                        <h2>
                            Modificación exitosa
                        </h2>


                        <p>
                            Los permisos del rol fueron actualizados correctamente.
                        </p>


                        <button
                            className="guardar"
                            onClick={() =>
                                setMostrarExitoPermisos(false)
                            }
                        >
                            Aceptar
                        </button>

                    </div>

                </div>

            )
        }

    </div>
  );
}

export default RolesPermisos;