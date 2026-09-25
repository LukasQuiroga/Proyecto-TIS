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
    modificarUsuario,
    obtenerRoles
} from "../../services/usuarioService";



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
                        usuarioRespuesta.data.nombre,


                    apellido:
                        usuarioRespuesta.data.apellido,


                    correo:
                        usuarioRespuesta.data.correo,


                    contrasena:"",


                    idRol:
                        usuarioRespuesta.data.idRol,


                    activo:
                        usuarioRespuesta.data.activo

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



        await modificarUsuario(

            id,

            usuario

        );



        navigate("/usuarios");


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

                    value={usuario.nombre}

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

                    value={usuario.apellido}

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

                    value={usuario.correo}

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

                    value={usuario.idRol}

                    onChange={
                        e=>

                        setUsuario({

                            ...usuario,

                            idRol:e.target.value

                        })

                    }

                >


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

                    value={usuario.activo}

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