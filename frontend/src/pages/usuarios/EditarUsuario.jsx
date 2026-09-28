import {
    useEffect,
    useState
} from "react";


import {
    useNavigate,
    useParams
} from "react-router-dom";


import {
    obtenerUsuario,
    modificarUsuario
} from "../../services/usuarioService";


import {
    obtenerRoles
} from "../../services/rolService";


function EditarUsuario(){

    const { id } = useParams();

    const navigate = useNavigate();

    const [usuario,setUsuario] = useState(null);

    const [roles,setRoles] = useState([]);


    useEffect(()=>{

        const cargarDatos = async()=>{

            try{

                const usuarioRespuesta =
                    await obtenerUsuario(id);


                const rolesRespuesta =
                    await obtenerRoles();


                setUsuario({

                    nombre:
                        usuarioRespuesta.data.nombre || "",

                    apellido:
                        usuarioRespuesta.data.apellido || "",

                    carnetIdentidad:
                        usuarioRespuesta.data.carnetIdentidad || "",

                    correo:
                        usuarioRespuesta.data.correo || "",

                    idRol:
                        usuarioRespuesta.data.idRol || "",

                    activo:
                        usuarioRespuesta.data.activo ?? true
                });


                setRoles(
                    rolesRespuesta.data
                );

            }catch(error){
                console.error(
                    "Error cargando usuario:",
                    error
                );

            }

        };

        cargarDatos();

    },[id]);


    const guardar = async(e)=>{
        e.preventDefault();

        try{

            await modificarUsuario(
                id,
                usuario
            );
        
            navigate("/usuarios");

        }catch(error){
            console.error(
                "Error modificando usuario:",
                error
            );
        }

    };

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
                Editar usuario
            </h1>


            <form onSubmit={guardar}>

                <input
                    value={
                        usuario.nombre || ""
                    }

                    onChange={
                        e=>
                        setUsuario({
                            ...usuario,
                            nombre:e.target.value
                        })
                    }
                    placeholder="Nombre"
                />


                <input
                    value={
                        usuario.apellido || ""
                    }

                    onChange={
                        e=>
                        setUsuario({
                            ...usuario,
                            apellido:e.target.value
                        })
                    }
                    placeholder="Apellido"

                />


                <input
                    value={
                        usuario.carnetIdentidad || ""
                    }

                    onChange={
                        e=>
                        setUsuario({
                            ...usuario,
                            carnetIdentidad:e.target.value
                        })
                    }
                    placeholder="Carnet de identidad"

                />


                <input
                    value={
                        usuario.correo || ""
                    }

                    onChange={
                        e=>
                        setUsuario({
                            ...usuario,
                            correo:e.target.value
                        })
                    }
                    placeholder="Correo"

                />


                <select

                    value={
                        usuario.idRol || ""
                    }

                    onChange={
                        e=>
                        setUsuario({
                            ...usuario,
                            idRol:Number(e.target.value)

                        })
                    }

                >

                    <option value="">
                        Seleccione un rol
                    </option>

                    {

                        roles.map(

                            rol=>(

                                <option
                                    key={rol.idRol}
                                    value={rol.idRol}

                                >
                                    {rol.nombreRol}
                                </option>

                            )
                        )
                    }
                </select>


                <select
                    value={
                        String(usuario.activo)
                    }

                    onChange={
                        e=>
                        setUsuario({
                           ...usuario,

                            activo:
                                e.target.value === "true"

                        })

                    }

                >

                    <option value="true">

                        Activo

                    </option>

                    <option value="false">

                        Inactivo

                    </option>

                </select>


                <button>

                    Guardar

                </button>

            </form>

        </div>

    );

}

export default EditarUsuario;