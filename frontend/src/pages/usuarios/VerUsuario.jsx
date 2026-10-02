import {useEffect,useState} from "react";
import {useNavigate,useParams} from "react-router-dom";
import {obtenerUsuario} from "../../services/usuarioService";
import "./VerUsuario.css";

function VerUsuario(){
    const {id}=useParams();
    const navigate=useNavigate();
    const [usuario,setUsuario]=useState(null);
    const [error,setError]=useState("");

    useEffect(()=>{
        const cargarUsuario=async()=>{
            try{
                setError("");
                const respuesta=await obtenerUsuario(id);
                setUsuario(respuesta.data);
            }catch(error){
                console.error("Error cargando usuario:",error);
                setError(error.response?.data?.message||"No se pudo cargar la información del usuario");
            }
        };

        cargarUsuario();
    },[id]);

    const formatearFecha=(fecha)=>{
        if(!fecha) return "No registrada";

        try{
            return new Intl.DateTimeFormat("es-BO",{
                day:"2-digit",
                month:"2-digit",
                year:"numeric",
                hour:"2-digit",
                minute:"2-digit"
            }).format(new Date(fecha));
        }catch{
            return fecha;
        }
    };

    if(error){
        return(
            <div className="ver-error">
                <strong>No se pudo cargar el usuario</strong>
                <p>{error}</p>
                <button onClick={()=>navigate("/usuarios")}>← Volver</button>
            </div>
        );
    }

    if(!usuario){
        return(
            <div className="ver-usuario-cargando">
                <div className="ver-spinner"></div>
                <span>Cargando información...</span>
            </div>
        );
    }

    const materias=usuario.materias||[];
    const inicial=`${usuario.nombre?.charAt(0)||""}${usuario.apellido?.charAt(0)||""}`.toUpperCase();

    return(
        <div className="ver-usuario-pagina">

            <div className="ver-migas">
                <span onClick={()=>navigate("/")}>Inicio</span>
                <b>›</b>
                <span onClick={()=>navigate("/usuarios")}>Usuarios</span>
                <b>›</b>
                <strong>Consultar usuario</strong>
            </div>

            <div className="ver-usuario-titulo">
                <h1>Consultar usuario</h1>
                <p>Visualiza la información completa del usuario seleccionado.</p>
            </div>

            <section className="ver-usuario-cabecera">
                <div className="ver-usuario-avatar">{inicial||"U"}</div>

                <div className="ver-cabecera-info">
                    <div className="ver-nombre-estado">
                        <h2>{usuario.nombre} {usuario.apellido}</h2>

                        <span className={`ver-estado ${usuario.activo?"activo":"inactivo"}`}>
                            <i></i>
                            {usuario.activo?"Activo":"Inactivo"}
                        </span>
                    </div>

                    <p>{usuario.correo||"Sin correo registrado"}</p>
                </div>

                <button
                    className="ver-boton-editar"
                    onClick={()=>navigate(`/usuarios/${id}/editar`)}
                >
                    Editar usuario
                </button>
            </section>

            <div className="ver-usuario-grid">

                <section className="ver-card ver-card-personal">
                    <div className="ver-card-cabecera">
                        <h3>Información personal</h3>
                        <p>Datos generales del usuario.</p>
                    </div>

                    <div className="ver-dato">
                        <span>Nombre</span>
                        <b>{usuario.nombre||"No registrado"}</b>
                    </div>

                    <div className="ver-dato">
                        <span>Apellidos</span>
                        <b>{usuario.apellido||"No registrado"}</b>
                    </div>

                    <div className="ver-dato">
                        <span>C.I.</span>
                        <b>{usuario.carnetIdentidad||"No registrado"}</b>
                    </div>

                    <div className="ver-dato">
                        <span>Correo electrónico</span>
                        <b>{usuario.correo||"No registrado"}</b>
                    </div>

                    <div className="ver-dato">
                        <span>Teléfono</span>
                        <b>{usuario.celular||"No registrado"}</b>
                    </div>

                    <div className="ver-dato">
                        <span>Carrera</span>
                        <b>{usuario.carrera||"No registrada"}</b>
                    </div>
                </section>

                <div className="ver-columna-derecha">

                    <section className="ver-card">
                        <div className="ver-card-cabecera">
                            <h3>Información de acceso</h3>
                            <p>Rol y estado dentro del sistema.</p>
                        </div>

                        <div className="ver-dato">
                            <span>Rol</span>
                            <b className="ver-rol">{usuario.nombreRol||"No registrado"}</b>
                        </div>

                        <div className="ver-dato">
                            <span>Estado</span>
                            <b className={usuario.activo?"ver-activo-texto":"ver-inactivo-texto"}>
                                {usuario.activo?"Activo":"Inactivo"}
                            </b>
                        </div>

                        <div className="ver-dato">
                            <span>Fecha de registro</span>
                            <b>{formatearFecha(usuario.fechaCreacion)}</b>
                        </div>
                    </section>

                    <section className="ver-card">
                        <div className="ver-card-cabecera">
                            <h3>Información académica</h3>
                            <p>Datos universitarios registrados.</p>
                        </div>

                        <div className="ver-dato">
                            <span>Código universitario</span>
                            <b>{usuario.codigoSis||"No registrado"}</b>
                        </div>

                        <div className="ver-dato">
                            <span>Carrera</span>
                            <b>{usuario.carrera||"No registrada"}</b>
                        </div>
                    </section>

                </div>

                <section className="ver-card ver-card-materias">
                    <div className="ver-materias-cabecera">
                        <div className="ver-card-cabecera sin-borde">
                            <h3>Materias y grupos</h3>
                            <p>Materias actualmente asociadas al usuario.</p>
                        </div>

                        <span className="ver-contador">
                            {materias.length} {materias.length===1?"materia":"materias"}
                        </span>
                    </div>

                    {materias.length===0?(
                        <div className="ver-sin-materias">
                            <div className="ver-sin-icono">▤</div>
                            <div>
                                <strong>Sin materias asociadas</strong>
                                <p>Este usuario no tiene materias registradas actualmente.</p>
                            </div>
                        </div>
                    ):(
                        <div className="ver-tabla-materias">
                            <div className="ver-tabla-cabecera">
                                <span>Materia</span>
                                <span>Grupo</span>
                            </div>

                            {materias.map(materia=>(
                                <div className="ver-materia-fila" key={materia.idMateria}>
                                    <span>{materia.nombreMateria}</span>
                                    <span className="ver-grupo-badge">
                                        Grupo {materia.grupo}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

            </div>

            <div className="ver-acciones">
                <button className="ver-boton-volver" onClick={()=>navigate("/usuarios")}>
                    ← Volver
                </button>
            </div>

        </div>
    );
}

export default VerUsuario;