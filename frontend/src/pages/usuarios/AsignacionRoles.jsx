import { useEffect, useRef, useState } from "react";
import "./AsignacionRoles.css";
import { obtenerUsuariosPaginado, cambiarRolUsuario} from "../../services/usuarioService";
import { obtenerRoles } from "../../services/rolService";

function AsignacionRoles() {

    const [usuarios, setUsuarios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [roles, setRoles] = useState([]);
    const [rolesSeleccionados, setRolesSeleccionados] = useState({});
    const [guardando, setGuardando] = useState(false);
    const [mostrarExito, setMostrarExito] = useState(false);
    const [paginaActual, setPaginaActual] = useState(0);
    const [totalPaginas, setTotalPaginas] = useState(0);
    const usuariosPorPagina = 7;
    const cargaInicialRealizada = useRef(false);

    const cargarUsuarios = async (pagina = 0) => {
        try {
            setCargando(true);
            const respuesta =
                await obtenerUsuariosPaginado(
                    pagina,
                    usuariosPorPagina
                );
            setUsuarios(
                respuesta.data.content
            );
            setTotalPaginas(
                respuesta.data.totalPages
            );
        } catch(error) {

            console.error(
                "Error cargando usuarios:",
                error
            );
        } finally {
            setCargando(false);
        }
    };


    useEffect(() => {
        if(cargaInicialRealizada.current){
            return;
        }
        cargaInicialRealizada.current = true;
        const cargarDatos = async () => {
            try {

                const respuestaRoles =
                    await obtenerRoles();
                setRoles(
                    respuestaRoles.data
                );
                await cargarUsuarios(0);
            } catch(error) {
                console.error(
                    "Error cargando datos:",
                    error
                );
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

            await cargarUsuarios(
                paginaActual
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

    const cambiarPagina = (pagina) => {
        if(
            pagina >= 0 &&
            pagina < totalPaginas
        ){
            setPaginaActual(pagina);
            cargarUsuarios(pagina);
        }
    };

    const generarPaginas = () => {
        const paginas = [];
        if(totalPaginas <= 6){
            for(
                let i = 0;
                i < totalPaginas;
                i++
            ){
                paginas.push(i);
            }
            return paginas;
        }

        paginas.push(0);
        if(paginaActual > 2){
            paginas.push("...");
        }

        const inicio =
            Math.max(
                1,
                paginaActual - 1
            );
        const fin =
            Math.min(
                totalPaginas - 2,
                paginaActual + 1
            );
        for(
            let i = inicio;
            i <= fin;
            i++
        ){
            paginas.push(i);
        }
        if(
            paginaActual <
            totalPaginas - 3
        ){
            paginas.push("...");
        }
        paginas.push(
            totalPaginas - 1
        );
        return paginas;
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

                        <div className="tabla-scroll">
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
                        </div>
                    )
                }

                {
                    totalPaginas > 1 && (
                        <div className="paginacion">
                            <button
                                className="pagina-boton"
                                disabled={paginaActual === 0}
                                onClick={() =>
                                    cambiarPagina(
                                        paginaActual - 1
                                    )
                                }
                            >
                                ‹
                            </button>
                            {
                                generarPaginas().map(
                                    (pagina, index) => {
                                        if(pagina === "..."){
                                            return (
                                                <span
                                                    key={`puntos-${index}`}
                                                    className="pagina-puntos"
                                                >
                                                    ...
                                                </span>
                                            );
                                        }
                                        return (
                                            <button
                                                key={pagina}
                                                className={
                                                    `pagina-boton ${
                                                        paginaActual === pagina
                                                            ? "pagina-activa"
                                                            : ""
                                                    }`
                                                }
                                                onClick={() =>
                                                    cambiarPagina(pagina)
                                                }
                                            >
                                                {pagina + 1}
                                            </button>
                                        );
                                    }
                                )
                            }
                            <button
                                className="pagina-boton"
                                disabled={
                                    paginaActual ===
                                    totalPaginas - 1
                                }
                                onClick={() =>
                                    cambiarPagina(
                                        paginaActual + 1
                                    )
                                }
                            >
                                ›
                            </button>
                        </div>
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