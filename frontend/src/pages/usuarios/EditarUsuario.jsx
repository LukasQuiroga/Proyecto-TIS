import "./EditarUsuario.css";
import {useEffect,useState} from "react";
import {useNavigate,useParams} from "react-router-dom";
import {obtenerUsuario,modificarUsuario} from "../../services/usuarioService";
import {obtenerRoles} from "../../services/rolService";

function EditarUsuario(){
    const {id}=useParams();
    const navigate=useNavigate();
    const [usuario,setUsuario]=useState(null);
    const [roles,setRoles]=useState([]);
    const [error,setError]=useState("");
    const [mensaje,setMensaje]=useState("");

    useEffect(()=>{
        const cargarDatos=async()=>{
            try{
                const usuarioRespuesta=await obtenerUsuario(id);
                const rolesRespuesta=await obtenerRoles();

                setUsuario({
                    nombre:usuarioRespuesta.data.nombre||"",
                    apellido:usuarioRespuesta.data.apellido||"",
                    carnetIdentidad:usuarioRespuesta.data.carnetIdentidad||"",
                    correo:usuarioRespuesta.data.correo||"",
                    celular:usuarioRespuesta.data.celular||"",
                    carrera:usuarioRespuesta.data.carrera||"",
                    codigoSis:usuarioRespuesta.data.codigoSis||"",
                    idRol:usuarioRespuesta.data.idRol||"",
                    activo:usuarioRespuesta.data.activo??true
                });

                setRoles(rolesRespuesta.data);
            }catch(error){
                console.error("Error cargando usuario:",error);
                setError("No se pudo cargar la información del usuario");
            }
        };

        cargarDatos();
    },[id]);

    const validarFormulario=()=>{
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

        const correoValido=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if(!correoValido.test(usuario.correo)){
            return "El correo no tiene un formato válido";
        }

        if(!usuario.idRol){
            return "Debe seleccionar un rol";
        }

        return null;
    };

    const guardar=async(e)=>{
        e.preventDefault();

        const mensajeValidacion=validarFormulario();

        if(mensajeValidacion){
            setError(mensajeValidacion);
            setMensaje("");
            return;
        }

        try{
            setError("");

            await modificarUsuario(id,usuario);

            setMensaje("Usuario modificado correctamente");

            setTimeout(()=>{
                navigate("/usuarios");
            },1500);
        }catch(error){
            console.error("Error modificando usuario:",error);

            if(error.response){
                setError(
                    error.response.data.message||
                    "No se pudo modificar el usuario"
                );
            }else{
                setError("Error de conexión con el servidor");
            }

            setMensaje("");
        }
    };

    if(!usuario){
        return(
            <div className="editar-cargando">
                Cargando...
            </div>
        );
    }

    return(
        <div className="editar-container">
            <div className="editar-contenido">

                <div className="editar-migas">
                    Inicio <span>›</span> Usuarios <span>›</span> Modificar usuario
                </div>

                <div className="editar-titulo">
                    <h1>Modificar usuario</h1>
                    <p>Corrija los errores en los campos indicados para poder guardar los cambios.</p>
                </div>

                <section className="editar-resumen">
                    <div className="editar-avatar">
                        {usuario.nombre.charAt(0).toUpperCase()}
                    </div>

                    <div className="editar-resumen-info">
                        <h2>{usuario.nombre} {usuario.apellido}</h2>

                        <span className={
                            usuario.activo
                            ?"editar-estado activo"
                            :"editar-estado inactivo"
                        }>
                            {usuario.activo?"Activo":"Inactivo"}
                        </span>

                        <p>Información del usuario</p>
                    </div>
                </section>

                {error&&(
                    <div className="editar-mensaje mensaje-error">
                        {error}
                    </div>
                )}

                {mensaje&&(
                    <div className="editar-mensaje mensaje-exito">
                        {mensaje}
                    </div>
                )}

                <form className="editar-form" onSubmit={guardar}>

                    <section className="editar-panel">

                        <h3>Información personal</h3>

                        <div className="editar-grid">

                            <div className="editar-campo">
                                <label>Nombre <span>*</span></label>
                                <input
                                    value={usuario.nombre}
                                    onChange={e=>setUsuario({
                                        ...usuario,
                                        nombre:e.target.value
                                    })}
                                />
                            </div>

                            <div className="editar-campo">
                                <label>Apellidos <span>*</span></label>
                                <input
                                    value={usuario.apellido}
                                    onChange={e=>setUsuario({
                                        ...usuario,
                                        apellido:e.target.value
                                    })}
                                />
                            </div>

                            <div className="editar-campo">
                                <label>Documento de identidad <span>*</span></label>
                                <input
                                    value={usuario.carnetIdentidad}
                                    onChange={e=>setUsuario({
                                        ...usuario,
                                        carnetIdentidad:e.target.value
                                    })}
                                    placeholder="Ingrese el C.I."
                                />
                            </div>

                            <div className="editar-campo">
                                <label>Correo electrónico <span>*</span></label>
                                <input
                                    type="email"
                                    value={usuario.correo}
                                    onChange={e=>setUsuario({
                                        ...usuario,
                                        correo:e.target.value
                                    })}
                                />
                            </div>

                            <div className="editar-campo">
                                <label>Teléfono</label>
                                <input
                                    value={usuario.celular}
                                    onChange={e=>setUsuario({
                                        ...usuario,
                                        celular:e.target.value
                                    })}
                                    placeholder="Ingrese el teléfono"
                                />
                            </div>

                            <div className="editar-campo">
                                <label>Carrera</label>
                                <input
                                    value={usuario.carrera}
                                    onChange={e=>setUsuario({
                                        ...usuario,
                                        carrera:e.target.value
                                    })}
                                    placeholder="Ingrese la carrera"
                                />
                            </div>

                        </div>

                    </section>

                    <section className="editar-panel">

                        <h3>Información de acceso</h3>

                        <div className="editar-grid">

                            <div className="editar-campo">
                                <label>Rol <span>*</span></label>

                                <select
                                    value={usuario.idRol}
                                    onChange={e=>setUsuario({
                                        ...usuario,
                                        idRol:Number(e.target.value)
                                    })}
                                >
                                    <option value="">Seleccione un rol</option>

                                    {roles.map(rol=>(
                                        <option
                                            key={rol.idRol}
                                            value={rol.idRol}
                                        >
                                            {rol.nombreRol}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="editar-campo">
                                <label>Estado <span>*</span></label>

                                <select
                                    value={String(usuario.activo)}
                                    onChange={e=>setUsuario({
                                        ...usuario,
                                        activo:e.target.value==="true"
                                    })}
                                >
                                    <option value="true">Activo</option>
                                    <option value="false">Inactivo</option>
                                </select>
                            </div>

                        </div>

                    </section>

                    <section className="editar-panel editar-panel-academico">

                        <h3>Información académica</h3>

                        <div className="editar-grid">

                            <div className="editar-campo">
                                <label>Código universitario</label>
                                <input
                                    value={usuario.codigoSis}
                                    onChange={e=>setUsuario({
                                        ...usuario,
                                        codigoSis:e.target.value
                                    })}
                                    placeholder="Ingrese el código SIS"
                                />
                            </div>

                        </div>

                    </section>

                    <div className="editar-acciones">

                        <button
                            type="button"
                            className="editar-boton-cancelar"
                            onClick={()=>navigate("/usuarios")}
                        >
                            ← Cancelar
                        </button>

                        <button
                            type="submit"
                            className="editar-boton-guardar"
                        >
                            ✓ Guardar cambios
                        </button>

                    </div>

                </form>

            </div>
        </div>
    );
}

export default EditarUsuario;