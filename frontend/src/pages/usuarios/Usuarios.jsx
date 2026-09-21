import {
    useEffect,
    useState
} from "react";


import {
    useNavigate
} from "react-router-dom";


import Navbar
from "../../components/Navbar/Navbar";


import Sidebar
from "../../components/Sidebar/Sidebar";


import {
    obtenerUsuarios
} from "../../services/usuarioService";


import "./Usuarios.css";



function IconoBuscar(){

    return (

        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >

            <circle
                cx="11"
                cy="11"
                r="7"
            />

            <path
                d="m20 20-4-4"
            />

        </svg>

    );

}



function IconoVer(){

    return (

        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >

            <path
                d="
                M2.5 12
                s3.5-6 9.5-6
                9.5 6 9.5 6
                -3.5 6-9.5 6
                -9.5-6-9.5-6Z
                "
            />

            <circle
                cx="12"
                cy="12"
                r="2.5"
            />

        </svg>

    );

}




function IconoEditar(){

    return (

        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >

            <path
                d="
                M12 20h9
                "
            />

            <path
                d="
                M16.5 3.5
                a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z
                "
            />

        </svg>

    );

}




function Usuarios(){


    const navigate = useNavigate();



    const [usuarios,setUsuarios] =
        useState([]);



    const [busqueda,setBusqueda] =
        useState("");



    const [rol,setRol] =
        useState("TODOS");





    useEffect(()=>{

        cargarUsuarios();

    },[]);





    async function cargarUsuarios(){


        try{


            const respuesta =
                await obtenerUsuarios();



            setUsuarios(
                respuesta.data
            );


        }catch(error){


            console.error(
                error
            );


        }


    }





    const usuariosFiltrados =
        usuarios.filter(
            usuario => {


                const texto =
                    busqueda.toLowerCase();



                const coincideTexto =

                    usuario.nombre
                    ?.toLowerCase()
                    .includes(texto)

                    ||

                    usuario.correo
                    ?.toLowerCase()
                    .includes(texto);



                const coincideRol =

                    rol === "TODOS"

                    ||

                    usuario.nombreRol === rol;



                return coincideTexto && coincideRol;


            }
        );







    return (

        <div className="usuarios-pagina">


            <header className="usuarios-encabezado">


                <div>

                    <h1>
                        Usuarios
                    </h1>


                    <p>
                        Gestiona los usuarios del sistema.
                        Registra, consulta y actualiza su información.
                    </p>

                </div>



                <button
                    className="usuarios-boton-nuevo"
                >

                    + Nuevo usuario

                </button>


            </header>





            <section className="usuarios-filtros">


                <div className="usuarios-busqueda">


                    <IconoBuscar />


                    <input

                        type="text"

                        placeholder="
                        Buscar usuario por nombre o correo...
                        "

                        value={busqueda}

                        onChange={
                            e =>
                            setBusqueda(
                                e.target.value
                            )
                        }

                    />


                </div>





                <select

                    value={rol}

                    onChange={
                        e =>
                        setRol(
                            e.target.value
                        )
                    }

                >

                    <option value="TODOS">
                        Todos los roles
                    </option>


                    {
                        [
                            ...new Set(
                                usuarios.map(
                                    u =>
                                    u.nombreRol
                                )
                            )
                        ]
                        .map(
                            rol => (

                                <option
                                    key={rol}
                                    value={rol}
                                >

                                    {rol}

                                </option>

                            )
                        )
                    }


                </select>


            </section>







            <section className="usuarios-panel">


                <table className="usuarios-tabla">


                    <thead>

                        <tr>

                            <th>
                                ID
                            </th>

                            <th>
                                Nombre
                            </th>


                            <th>
                                Correo
                            </th>


                            <th>
                                Rol
                            </th>


                            <th>
                                Estado
                            </th>


                            <th>
                                Acciones
                            </th>


                        </tr>


                    </thead>



                    <tbody>


                    {

                        usuariosFiltrados.map(

                            usuario => (

                                <tr

                                    key={
                                        usuario.idUsuario
                                    }

                                >


                                    <td>
                                        {
                                            usuario.idUsuario
                                        }
                                    </td>



                                    <td>
                                        {
                                            usuario.nombre
                                        }
                                        {" "}
                                        {
                                            usuario.apellido
                                        }
                                    </td>



                                    <td>
                                        {
                                            usuario.correo
                                        }
                                    </td>



                                    <td>
                                        {
                                            usuario.nombreRol
                                        }
                                    </td>



                                    <td>


                                        <span

                                            className={
                                                usuario.activo

                                                ?

                                                "usuarios-estado activo"

                                                :

                                                "usuarios-estado inactivo"
                                            }

                                        >

                                            {
                                                usuario.activo
                                                ?
                                                "Activo"
                                                :
                                                "Inactivo"
                                            }


                                        </span>


                                    </td>

                                    <td>


                                        <button

                                            className="usuarios-boton-ver"

                                            onClick={
                                                ()=>navigate(
                                                    `/usuarios/${usuario.idUsuario}`
                                                )
                                            }

                                        >

                                            <IconoVer/>

                                            Ver

                                        </button>

                                        <button
                                            className="usuarios-boton-editar"

                                            onClick={
                                                ()=>navigate(
                                                    `/usuarios/${usuario.idUsuario}/editar`
                                                )
                                            }
                                        >
                                            <IconoEditar/>

                                            Editar

                                        </button>


                                    </td>



                                </tr>

                            )

                        )

                    }

                    </tbody>

                </table>

                <div className="usuarios-pie">

                    Mostrando {usuariosFiltrados.length}
                    {" "}
                    de {usuarios.length}
                    {" "}
                    usuarios


                </div>


            </section>




        </div>

    );

}

export default Usuarios;