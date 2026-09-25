import { useEffect, useState } from "react";
import "./AsignacionRoles.css";
import { obtenerUsuarios, cambiarRolUsuario} from "../../services/usuarioService";
import { obtenerRoles } from "../../services/rolService";

function AsignacionRoles() {

    const [usuarios, setUsuarios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [roles, setRoles] = useState([]);
    const [rolesSeleccionados, setRolesSeleccionados] = useState({});
    const [guardando, setGuardando] = useState(false);
    const [mostrarExito, setMostrarExito] = useState(false);


    useEffect(() => {

        const cargarDatos = async () => {

            try {

                const [
                    respuestaUsuarios,
                    respuestaRoles
                ] = await Promise.all([
                    obtenerUsuarios(),
                    obtenerRoles()
                ]);

                setUsuarios(
                    respuestaUsuarios.data
                );

                setRoles(
                    respuestaRoles.data
                );

            } catch(error) {

                console.error(
                    "Error cargando datos:",
                    error
                );

            } finally {

                setCargando(false);

            }

        };

        cargarDatos();

    }, []);

    const cambiarRol = (idUsuario, idRol) => {
        setRolesSeleccionados({
            ...rolesSeleccionados,
            [idUsuario]: idRol
        });
    };

    const guardarRol = async (usuario) => {
        try {
            const nuevoRol =
                rolesSeleccionados[usuario.idUsuario];

            if(!nuevoRol){
                return;
            }

            setGuardando(true);

            await cambiarRolUsuario(
                usuario.idUsuario,
                nuevoRol
            );

            const respuesta =
                await obtenerUsuarios();

            setUsuarios(
                respuesta.data
            );

            setMostrarExito(true);

        } catch(error) {

            console.error(
                "Error actualizando rol:",
                error.response?.data
            );

        } finally {
            setGuardando(false);
        }

    };

    return (
        <div className="asignacion-roles">
            <div className="asignacion-header">
                <h2>Asignación de Roles</h2>
                <p>Visualice los usuarios y el rol actual asignado.</p>
            </div>

            <div className="tabla-contenedor">
                {
                    cargando ? (
                        <p className="cargando">
                            Cargando usuarios...
                        </p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Usuario</th>
                                    <th>Correo</th>
                                    <th>Rol actual</th>
                                    <th>Nuevo rol</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>

                            <tbody>
                                {
                                    usuarios.length > 0 ? (
                                        usuarios.map((usuario) => (
                                            <tr key={usuario.idUsuario}>
                                                <td>
                                                    {usuario.nombre} {usuario.apellido}
                                                </td>
                                                <td>
                                                    {usuario.correo}
                                                </td>
                                                <td>
                                                    <span className="rol">
                                                        {usuario.nombreRol}
                                                    </span>
                                                </td>
                                                <td>
                                                <select
                                                    value={
                                                        rolesSeleccionados[usuario.idUsuario]
                                                        || usuario.idRol
                                                    }
                                                    onChange={(e)=>
                                                        cambiarRol(
                                                            usuario.idUsuario,
                                                            Number(e.target.value)
                                                        )
                                                    }
                                                >
                                                {
                                                    roles.map((rol)=>(

                                                        <option
                                                            key={rol.idRol}
                                                            value={rol.idRol}
                                                        >
                                                            {rol.nombreRol}
                                                        </option>

                                                    ))
                                                }
                                                </select>
                                                </td>
                                                <td>

                                                    <button
                                                        className="guardar-rol"
                                                        disabled={guardando}
                                                        onClick={() => guardarRol(usuario)}
                                                    >
                                                        {
                                                            guardando
                                                            ? "Guardando..."
                                                            : "Guardar"
                                                        }
                                                    </button>

                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="sin-datos">
                                                No existen usuarios registrados.
                                            </td>
                                        </tr>
                                    )
                                }
                            </tbody>
                        </table>
                    )
                }
            </div>
            {
                mostrarExito && (

                    <div className="modal-fondo">

                        <div className="modal-exito">

                            <div className="icono-exito">
                                ✓
                            </div>

                            <h2>
                                Rol actualizado correctamente
                            </h2>

                            <button
                                className="guardar-rol"
                                onClick={() => setMostrarExito(false)}
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

export default AsignacionRoles;