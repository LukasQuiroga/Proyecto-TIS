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
    const [materias,setMaterias]=useState([]);
    const [error,setError]=useState("");
    const [mensaje,setMensaje]=useState("");
    const [guardando,setGuardando]=useState(false);

    useEffect(()=>{
        const cargarDatos=async()=>{
            try{
                setError("");

                const [usuarioRespuesta,rolesRespuesta]=await Promise.all([
                    obtenerUsuario(id),
                    obtenerRoles()
                ]);

                const datos=usuarioRespuesta.data;

                setUsuario({
                    nombre:datos.nombre||"",
                    apellido:datos.apellido||"",
                    carnetIdentidad:datos.carnetIdentidad||"",
                    correo:datos.correo||"",
                    celular:datos.celular||"",
                    carrera:datos.carrera||"",
                    codigoSis:datos.codigoSis||"",
                    idRol:datos.idRol||"",
                    activo:datos.activo??true
                });

                setMaterias(datos.materias||[]);
                setRoles(rolesRespuesta.data||[]);
            }catch(error){
                console.error("Error cargando usuario:",error);
                setError(
                    error.response?.data?.message||
                    "No se pudo cargar la información del usuario"
                );
            }
        };

        cargarDatos();
    },[id]);

    const actualizarCampo=(campo,valor)=>{
        setUsuario(actual=>({
            ...actual,
            [campo]:valor
        }));
    };

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

        if(!/^[0-9]+$/.test(usuario.carnetIdentidad.trim())){
            return "El carnet de identidad solo debe contener números";
        }

        if(!usuario.correo.trim()){
            return "El correo es obligatorio";
        }

        const correoValido=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if(!correoValido.test(usuario.correo.trim())){
            return "El correo no tiene un formato válido";
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
            setGuardando(true);
            setError("");
            setMensaje("");

            const datosModificar={
                nombre:usuario.nombre,
                apellido:usuario.apellido,
                carnetIdentidad:usuario.carnetIdentidad,
                correo:usuario.correo,
                celular:usuario.celular,
                carrera:usuario.carrera,
                activo:usuario.activo
            };

            await modificarUsuario(id,datosModificar);

            setMensaje("Usuario modificado correctamente");

            setTimeout(()=>{
                navigate("/usuarios");
            },1200);
        }catch(error){
            console.error("Error modificando usuario:",error);

            setError(
                error.response?.data?.message||
                "No se pudo modificar el usuario"
            );
        }finally{
            setGuardando(false);
        }
    };

    if(!usuario){
        return(
            <div className="editar-cargando">
                Cargando...
            </div>
        );
    }

    const nombreRol=
        roles.find(rol=>rol.idRol===Number(usuario.idRol))?.nombreRol||
        "Sin rol";

    return(
        <div className="editar-container">
            <div className="editar-contenido">
                <div className="editar-migas">
                    Inicio
                    <span>›</span>
                    Usuarios
                    <span>›</span>
                    Modificar usuario
                </div>

                <div className="editar-titulo">
                    <h1>Modificar usuario</h1>
                    <p>
                        Actualice la información personal,
                        académica y de acceso del usuario.
                    </p>
                </div>

                <section className="editar-resumen">
                    <div className="editar-avatar">
                        {usuario.nombre
                            ?usuario.nombre.charAt(0).toUpperCase()
                            :"U"}
                    </div>

                    <div className="editar-resumen-info">
                        <h2>
                            {usuario.nombre} {usuario.apellido}
                        </h2>

                        <span className={
                            usuario.activo
                                ?"editar-estado activo"
                                :"editar-estado inactivo"
                        }>
                            {usuario.activo
                                ?"Activo"
                                :"Inactivo"}
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

                <form
                    className="editar-form"
                    onSubmit={guardar}
                >
                    <section className="editar-panel">
                        <h3>Información personal</h3>

                        <div className="editar-grid">
                            <div className="editar-campo">
                                <label>
                                    Nombre <span>*</span>
                                </label>

                                <input
                                    value={usuario.nombre}
                                    onChange={e=>
                                        actualizarCampo(
                                            "nombre",
                                            e.target.value
                                        )
                                    }
                                />
                            </div>

                            <div className="editar-campo">
                                <label>
                                    Apellidos <span>*</span>
                                </label>

                                <input
                                    value={usuario.apellido}
                                    onChange={e=>
                                        actualizarCampo(
                                            "apellido",
                                            e.target.value
                                        )
                                    }
                                />
                            </div>

                            <div className="editar-campo">
                                <label>
                                    Documento de identidad
                                    <span>*</span>
                                </label>

                                <input
                                    value={usuario.carnetIdentidad}
                                    onChange={e=>
                                        actualizarCampo(
                                            "carnetIdentidad",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Ingrese el C.I."
                                />
                            </div>

                            <div className="editar-campo">
                                <label>
                                    Correo electrónico
                                    <span>*</span>
                                </label>

                                <input
                                    type="email"
                                    value={usuario.correo}
                                    onChange={e=>
                                        actualizarCampo(
                                            "correo",
                                            e.target.value
                                        )
                                    }
                                />
                            </div>

                            <div className="editar-campo">
                                <label>Teléfono</label>

                                <input
                                    value={usuario.celular}
                                    onChange={e=>
                                        actualizarCampo(
                                            "celular",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Ingrese el teléfono"
                                />
                            </div>

                            <div className="editar-campo">
                                <label>Carrera</label>

                                <input
                                    value={usuario.carrera}
                                    onChange={e=>
                                        actualizarCampo(
                                            "carrera",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Ingrese la carrera"
                                />
                            </div>
                        </div>
                    </section>

                    <section className="editar-panel">
                        <h3>Información de acceso</h3>

                        <div className="editar-grid">
                            <div className="editar-campo">
                                <label>Rol</label>

                                <div className="editar-solo-lectura">
                                    {nombreRol}
                                </div>
                            </div>

                            <div className="editar-campo">
                                <label>
                                    Estado <span>*</span>
                                </label>

                                <select
                                    value={String(usuario.activo)}
                                    onChange={e=>
                                        actualizarCampo(
                                            "activo",
                                            e.target.value==="true"
                                        )
                                    }
                                >
                                    <option value="true">
                                        Activo
                                    </option>

                                    <option value="false">
                                        Inactivo
                                    </option>
                                </select>
                            </div>
                        </div>
                    </section>

                    <section className="editar-panel editar-panel-academico">
                        <h3>Información académica</h3>

                        <div className="editar-grid">
                            <div className="editar-campo">
                                <label>
                                    Código universitario
                                </label>

                                <div className="editar-solo-lectura">
                                    {usuario.codigoSis||
                                    "Sin código universitario"}
                                </div>
                            </div>
                        </div>

                        <div className="editar-materias">
                            <div className="editar-materias-titulo">
                                Materias y grupos
                            </div>

                            {materias.length===0?(
                                <div className="editar-sin-materias">
                                    No tiene materias asociadas.
                                </div>
                            ):(
                                <div className="editar-tabla-materias">
                                    {materias.map(materia=>(
                                        <div
                                            className="editar-materia-fila"
                                            key={materia.idMateria}
                                        >
                                            <span>
                                                {materia.nombreMateria}
                                            </span>

                                            <strong>
                                                Grupo {materia.grupo}
                                            </strong>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <p className="editar-ayuda-materias">
                                Las materias mostradas corresponden
                                a las asignadas al usuario como
                                docente en la base de datos actual.
                            </p>
                        </div>
                    </section>

                    <div className="editar-acciones">
                        <button
                            type="button"
                            className="editar-boton-cancelar"
                            onClick={()=>navigate("/usuarios")}
                            disabled={guardando}
                        >
                            ← Cancelar
                        </button>

                        <button
                            type="submit"
                            className="editar-boton-guardar"
                            disabled={guardando}
                        >
                            {guardando
                                ?"Guardando..."
                                :"✓ Guardar cambios"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditarUsuario;