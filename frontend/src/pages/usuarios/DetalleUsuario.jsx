import {
    useEffect,
    useState
} from "react";


import {
    useNavigate,
    useParams
} from "react-router-dom";


import {
    obtenerUsuario
} from "../../services/usuarioService";


function DetalleUsuario(){

    const { id } = useParams();

    const navigate = useNavigate();

    const [usuario,setUsuario] = useState(null);


    useEffect(()=>{

        const cargarUsuario = async()=>{

            try{

                const respuesta =
                    await obtenerUsuario(id);


                setUsuario(
                    respuesta.data
                );

            }catch(error){


                console.error(
                    "Error cargando usuario:",
                    error
                );

            }


        };

        cargarUsuario();

    },[id]);


    if(!usuario){

        return (

            <p>

                Cargando...

            </p>

        );

    }


    return (


        <div>

            <h1>

                Detalle del usuario

            </h1>

            <p>

                <strong>
                    Nombre:
                </strong>

                {" "}

                {usuario.nombre}

            </p>

            <p>

                <strong>
                    Apellido:
                </strong>

                {" "}

                {usuario.apellido}

            </p>

            <p>

                <strong>
                    Carnet:
                </strong>

                {" "}

                {usuario.carnetIdentidad}

            </p>

            <p>

                <strong>
                    Correo:
                </strong>

                {" "}

                {usuario.correo}

            </p>

            <p>

                <strong>
                    Rol:
                </strong>

                {" "}

                {usuario.nombreRol}

            </p>

            <p>

                <strong>
                    Estado:
                </strong>

                {" "}

                {
                    usuario.activo
                    ?
                    "Activo"
                    :
                    "Inactivo"
                }

            </p>


            <h3>
                Permisos
            </h3>

            <ul>

                {

                    usuario.permisos?.map(

                        permiso=>(

                            <li
                                key={permiso}
                            >

                                {permiso}
                            </li>
                        )

                    )

                }

            </ul>

            <button

                onClick={

                    ()=>navigate(
                        `/usuarios/${id}/editar`
                    )

                }

            >
                Editar usuario
            </button>

        </div>

    );

}


export default DetalleUsuario;