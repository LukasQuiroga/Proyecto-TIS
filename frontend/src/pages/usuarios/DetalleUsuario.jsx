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

import "./DetalleUsuario.css";


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

        <div className="detalle-container">


            <div className="detalle-card">


                <h1>

                    Detalle del usuario

                </h1>


                <div className="detalle-item">

                    <strong>
                        Nombre:
                    </strong>

                    <span>
                        {usuario.nombre}
                    </span>

                </div>


                <div className="detalle-item">

                    <strong>
                        Apellido:
                    </strong>

                    <span>
                        {usuario.apellido}
                    </span>

                </div>


                <div className="detalle-item">

                    <strong>
                        Carnet:
                    </strong>

                    <span>
                        {usuario.carnetIdentidad}
                    </span>

                </div>


                <div className="detalle-item">

                    <strong>
                        Correo:
                    </strong>

                    <span>
                        {usuario.correo}
                    </span>

                </div>

                <div className="detalle-item">

                    <strong>
                        Rol:
                    </strong>

                    <span>
                        {usuario.nombreRol}
                    </span>

                </div>

                <div className="detalle-item">

                    <strong>
                        Estado:
                    </strong>

                    <span>

                        {
                            usuario.activo
                            ?
                            "Activo"
                            :
                            "Inactivo"
                        }

                    </span>

                </div>


                <h3>

                    Permisos

                </h3>


                <ul className="detalle-permisos">

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

                <div className="detalle-botones">


                    <button

                        onClick={

                            ()=>navigate("/usuarios")

                        }

                    >
                        Volver

                    </button>


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

            </div>
        </div>

    );

}

export default DetalleUsuario;