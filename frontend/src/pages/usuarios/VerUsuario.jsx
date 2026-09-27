import {useEffect,useState} from "react";
import {useNavigate,useParams} from "react-router-dom";
import {obtenerUsuario} from "../../services/usuarioService";
import "./VerUsuario.css";

function VerUsuario(){

    const {id}=useParams();
    const navigate=useNavigate();

    const [usuario,setUsuario]=useState(null);

    useEffect(()=>{

        const cargarUsuario=async()=>{

            try{

                const respuesta=await obtenerUsuario(id);
                setUsuario(respuesta.data);

            }catch(error){

                console.error("Error cargando usuario:",error);

            }

        };

        cargarUsuario();

    },[id]);


    if(!usuario){

        return(
            <div className="ver-usuario-cargando">
                Cargando información...
            </div>
        );

    }


    return(

        <div className="ver-usuario-pagina">

            <div className="ver-usuario-titulo">

                <h1>Consultar usuario</h1>

                <p>
                    Visualiza la información del usuario seleccionado.
                </p>

            </div>


            <section className="ver-usuario-cabecera">

                <div className="ver-usuario-avatar">
                    👤
                </div>


                <div>

                    <h2>
                        {usuario.nombre} {usuario.apellido}
                    </h2>

                    <span className={
                        usuario.activo
                        ?"ver-estado activo"
                        :"ver-estado inactivo"
                    }>
                        {
                            usuario.activo
                            ?"Activo"
                            :"Inactivo"
                        }
                    </span>

                </div>

            </section>



            <div className="ver-usuario-grid">


                <section className="ver-card">

                    <h3>
                        Información personal
                    </h3>


                    <div className="ver-dato">
                        <span>Nombre:</span>
                        <b>{usuario.nombre}</b>
                    </div>


                    <div className="ver-dato">
                        <span>Apellidos:</span>
                        <b>{usuario.apellido}</b>
                    </div>


                    <div className="ver-dato">
                        <span>C.I.:</span>
                        <b>{usuario.carnetIdentidad}</b>
                    </div>


                    <div className="ver-dato">
                        <span>Correo electrónico:</span>
                        <b>{usuario.correo}</b>
                    </div>


                    <div className="ver-dato">
                        <span>Celular:</span>
                        <b>{usuario.celular || "No registrado"}</b>
                    </div>


                </section>



                <div>


                    <section className="ver-card">

                        <h3>
                            Información de acceso
                        </h3>


                        <div className="ver-dato">
                            <span>Rol:</span>
                            <b>{usuario.nombreRol}</b>
                        </div>


                        <div className="ver-dato">
                            <span>Estado:</span>
                            <b>
                                {
                                    usuario.activo
                                    ?"Activo"
                                    :"Inactivo"
                                }
                            </b>
                        </div>


                    </section>



                    <section className="ver-card">

                        <h3>
                            Información del sistema
                        </h3>


                        <div className="ver-dato">

                            <span>
                                Fecha de creación:
                            </span>

                            <b>
                                {
                                    usuario.fechaCreacion ||
                                    "No registrada"
                                }
                            </b>

                        </div>


                    </section>


                </div>


            </div>



            <button
                className="ver-boton-volver"
                onClick={()=>navigate("/usuarios")}
            >
                ← Volver
            </button>


        </div>

    );

}


export default VerUsuario;