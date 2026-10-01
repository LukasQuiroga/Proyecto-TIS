import {useEffect,useState} from "react";
import {useNavigate} from "react-router-dom";
import {obtenerUsuarios} from "../../services/usuarioService";
import "./Usuarios.css";

function IconoVer(){
    return(
        <svg viewBox="0 0 24 24">
            <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/>
            <circle cx="12" cy="12" r="2.5"/>
        </svg>
    );
}

function IconoEditar(){
    return(
        <svg viewBox="0 0 24 24">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>
        </svg>
    );
}

function Usuarios(){

    const navigate=useNavigate();

    const [usuarios,setUsuarios]=useState([]);
    const [nombre,setNombre]=useState("");
    const [apellido,setApellido]=useState("");
    const [ci,setCi]=useState("");
    const [correo,setCorreo]=useState("");
    const [rol,setRol]=useState("TODOS");
    const [estado,setEstado]=useState("TODOS");

    useEffect(()=>{

        const cargarDatos=async()=>{

            try{
                const respuesta=await obtenerUsuarios();
                setUsuarios(respuesta.data);
            }catch(error){
                console.error("Error cargando usuarios:",error);
            }

        };

        cargarDatos();

    },[]);


    const usuariosFiltrados=usuarios.filter(usuario=>{

        const coincideNombre=
            !nombre ||
            (usuario.nombre || "")
            .toLowerCase()
            .includes(nombre.toLowerCase());


        const coincideApellido=
            !apellido ||
            (usuario.apellido || "")
            .toLowerCase()
            .includes(apellido.toLowerCase());


        const coincideCi=
            !ci ||
            String(usuario.carnetIdentidad || "")
            .includes(ci);


        const coincideCorreo=
            !correo ||
            (usuario.correo || "")
            .toLowerCase()
            .includes(correo.toLowerCase());


        const coincideRol=
            rol==="TODOS" ||
            usuario.nombreRol===rol;


        const coincideEstado=
            estado==="TODOS" ||
            (usuario.activo?"ACTIVO":"INACTIVO")===estado;


        return(
            coincideNombre &&
            coincideApellido &&
            coincideCi &&
            coincideCorreo &&
            coincideRol &&
            coincideEstado
        );

    });


    return(
        <div className="usuarios-pagina">

            <header className="usuarios-encabezado">
                <div>
                    <h1>Usuarios</h1>
                    <p>Gestiona los usuarios del sistema. Registra, consulta y actualiza su información.</p>
                </div>



                    <button
                        className="usuarios-boton-nuevo"
                        onClick={() => navigate("/usuarios/registrar")}
                    >
                        + Nuevo usuario
                    </button>


            </header>


            <section className="usuarios-filtros">

                <div className="usuarios-filtros-grid">

                    <input
                        placeholder="Nombre"
                        value={nombre}
                        onChange={e=>setNombre(e.target.value)}
                    />

                    <input
                        placeholder="Apellido"
                        value={apellido}
                        onChange={e=>setApellido(e.target.value)}
                    />

                    <input
                        placeholder="C.I."
                        value={ci}
                        onChange={e=>setCi(e.target.value)}
                    />

                    <input
                        placeholder="Correo"
                        value={correo}
                        onChange={e=>setCorreo(e.target.value)}
                    />

                    <select
                        value={rol}
                        onChange={e=>setRol(e.target.value)}
                    >
                        <option value="TODOS">
                            Todos los roles
                        </option>

                        {
                            [...new Set(
                                usuarios.map(u=>u.nombreRol)
                            )]
                            .map(r=>(
                                <option
                                    key={r}
                                    value={r}
                                >
                                    {r}
                                </option>
                            ))
                        }

                    </select>


                    <select
                        value={estado}
                        onChange={e=>setEstado(e.target.value)}
                    >
                        <option value="TODOS">
                            Todos los estados
                        </option>

                        <option value="ACTIVO">
                            Activo
                        </option>

                        <option value="INACTIVO">
                            Inactivo
                        </option>

                    </select>

                </div>


                <div className="usuarios-filtros-botones">

                    <button className="usuarios-boton-buscar">
                        Buscar
                    </button>


                    <button
                        className="usuarios-boton-limpiar"
                        onClick={()=>{

                            setNombre("");
                            setApellido("");
                            setCi("");
                            setCorreo("");
                            setRol("TODOS");
                            setEstado("TODOS");

                        }}
                    >
                        Limpiar
                    </button>

                </div>

            </section>


            <section className="usuarios-panel">

                <table className="usuarios-tabla">

                    <thead>
                        <tr>
                            <th>N°</th>
                            <th>Nombre</th>
                            <th>Apellido</th>
                            <th>C.I.</th>
                            <th>Correo</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>


                    <tbody>

                        {
                            usuariosFiltrados.map((usuario,index)=>(

                                <tr key={usuario.idUsuario}>

                                    <td>
                                        {index+1}
                                    </td>

                                    <td>
                                        {usuario.nombre}
                                    </td>

                                    <td>
                                        {usuario.apellido}
                                    </td>

                                    <td>
                                        {usuario.carnetIdentidad}
                                    </td>

                                    <td>
                                        {usuario.correo}
                                    </td>

                                    <td>
                                        {usuario.nombreRol}
                                    </td>

                                    <td>

                                        <span
                                            className={
                                                usuario.activo
                                                ?"usuarios-estado activo"
                                                :"usuarios-estado inactivo"
                                            }
                                        >
                                            {
                                                usuario.activo
                                                ?"Activo"
                                                :"Inactivo"
                                            }
                                        </span>

                                    </td>


                                    <td>

                                        <button
                                            className="usuarios-boton-ver"
                                            onClick={()=>
                                                navigate(`/usuarios/${usuario.idUsuario}`)
                                            }
                                        >
                                            <IconoVer/>
                                            Ver
                                        </button>


                                        <button
                                            className="usuarios-boton-editar"
                                            onClick={()=>
                                                navigate(`/usuarios/${usuario.idUsuario}/editar`)
                                            }
                                        >
                                            <IconoEditar/>
                                            Editar
                                        </button>

                                    </td>

                                </tr>

                            ))
                        }

                    </tbody>

                </table>


                <div className="usuarios-pie">
                    Mostrando {usuariosFiltrados.length} de {usuarios.length} usuarios
                </div>

            </section>

        </div>
    );

}

export default Usuarios;