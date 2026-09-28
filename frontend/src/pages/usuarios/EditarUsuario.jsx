import "./EditarUsuario.css";

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


    const [error,setError] = useState("");


    const [mensaje,setMensaje] = useState("");


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


    const validarFormulario = ()=>{


        if(!usuario.nombre.trim()){

            return "El nombre es obligatorio";

        }


        if(!usuario.apellido.trim()){

            return "El apellido es obligatorio";

        }


        if(!usuario.carnetIdentidad.trim()){

            return "El carnet de identidad es obligatorio";

        }


        if(!/^[0-9]+$/.test(usuario.carnetIdentidad)){

            return "El carnet de identidad solo debe contener números";

        }

        if(!usuario.correo.trim()){

            return "El correo es obligatorio";

        }

        const correoValido =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if(!correoValido.test(usuario.correo)){

            return "El correo no tiene un formato válido";

        }

        return null;

    };


    const guardar = async(e)=>{

        e.preventDefault();

        const mensajeValidacion =
            validarFormulario();


        if(mensajeValidacion){

            setError(
                mensajeValidacion
            );

            return;

        }

        try{

            setError("");

            await modificarUsuario(
                id,
                usuario
            );


            setMensaje(
                "Usuario modificado correctamente"
            );

            setTimeout(()=>{

                navigate("/usuarios");

            },1500);


        }catch(error){

            console.error(
                "Error modificando usuario:",
                error
            );


            if(error.response){

                setError(
                    error.response.data.message ||
                    "No se pudo modificar el usuario"

                );


            }else{

                setError(
                    "Error de conexión con el servidor"
                );

            }

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

        <div className="editar-container">

            <div className="editar-card">

                <h1>
                    Editar usuario
                </h1>


                {
                    error && (
                        <p className="mensaje-error">
                            {error}
                        </p>

                    )
                }


                {
                    mensaje && (

                        <p className="mensaje-exito">
                            {mensaje}
                        </p>

                    )
                }


                <form
                    className="editar-form"
                    onSubmit={guardar}

                >

                    <input

                        value={
                            usuario.nombre || ""
                        }

                        onChange={
                            e =>
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
                            e =>
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
                            e =>
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
                            e =>
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
                            e =>
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
                                rol => (
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
                            e =>
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


                    <button type="submit">
                        Guardar cambios
                    </button>

                </form>

            </div>

        </div>
    );
}

export default EditarUsuario;