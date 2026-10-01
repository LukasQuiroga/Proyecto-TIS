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
                setError(error.response?.data?.message||"No se pudo cargar la información del usuario");
            }
        };

        cargarDatos();
    },[id]);

    const actualizarCampo=(campo,valor)=>{
        setUsuario(actual=>({...actual,[campo]:valor}));
    };

    const validarFormulario=()=>{
        if(!usuario.nombre.trim()) return "El nombre es obligatorio";
        if(!usuario.apellido.trim()) return "El apellido es obligatorio";
        if(!usuario.carnetIdentidad.trim()) return "El carnet de identidad es obligatorio";
        if(!/^[0-9]+$/.test(usuario.carnetIdentidad.trim())) return "El carnet de identidad solo debe contener números";
        if(!usuario.correo.trim()) return "El correo es obligatorio";
        if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usuario.correo.trim())) return "El correo no tiene un formato válido";
        if(!usuario.idRol) return "Debe seleccionar un rol";
        return null;
    };

    const guardar=async(e)=>{
        e.preventDefault();

        const validacion=validarFormulario();

        if(validacion){
            setError(validacion);
            setMensaje("");
            return;
        }

        try{
            setGuardando(true);
            setError("");
            setMensaje("");

            await modificarUsuario(id,{
                ...usuario,
                idRol:Number(usuario.idRol)
            });

            setMensaje("Usuario modificado correctamente");

            setTimeout(()=>{
                navigate("/usuarios");
            },1000);
        }catch(error){
            console.error("Error modificando usuario:",error);
            setError(error.response?.data?.message||"No se pudo modificar el usuario");
        }finally{
            setGuardando(false);
        }
    };

    if(!usuario){
        return(
            <div className="editar-cargando">
                <div className="editar-spinner"></div>
                <span>Cargando usuario...</span>
            </div>
        );
    }

    const inicial=`${usuario.nombre?.charAt(0)||""}${usuario.apellido?.charAt(0)||""}`.toUpperCase();

    return(
        <div className="editar-container">
            <div className="editar-contenido">

                <div className="editar-migas">
                    <span onClick={()=>navigate("/")}>Inicio</span>
                    <b>›</b>
                    <span onClick={()=>navigate("/usuarios")}>Usuarios</span>
                    <b>›</b>
                    <strong>Modificar usuario</strong>
                </div>

                <div className="editar-titulo">
                    <h1>Modificar usuario</h1>
                    <p>Actualiza la información personal, académica y de acceso del usuario.</p>
                </div>

                <section className="editar-resumen">
                    <div className="editar-avatar">{inicial||"U"}</div>

                    <div className="editar-resumen-info">
                        <div className="editar-resumen-superior">
                            <h2>{usuario.nombre} {usuario.apellido}</h2>
                            <span className={`editar-estado ${usuario.activo?"activo":"inactivo"}`}>
                                <i></i>
                                {usuario.activo?"Activo":"Inactivo"}
                            </span>
                        </div>
                        <p>Información general del usuario</p>
                    </div>
                </section>

                {error&&(
                    <div className="editar-mensaje mensaje-error">
                        <span>!</span>
                        {error}
                    </div>
                )}

                {mensaje&&(
                    <div className="editar-mensaje mensaje-exito">
                        <span>✓</span>
                        {mensaje}
                    </div>
                )}

                <form className="editar-form" onSubmit={guardar}>

                    <section className="editar-panel">
                        <div className="editar-panel-cabecera">
                            <div>
                                <h3>Información personal</h3>
                                <p>Datos generales e identificación del usuario.</p>
                            </div>
                        </div>

                        <div className="editar-grid">
                            <div className="editar-campo">
                                <label>Nombre <span>*</span></label>
                                <input
                                    value={usuario.nombre}
                                    onChange={e=>actualizarCampo("nombre",e.target.value)}
                                    placeholder="Ingrese el nombre"
                                />
                            </div>

                            <div className="editar-campo">
                                <label>Apellidos <span>*</span></label>
                                <input
                                    value={usuario.apellido}
                                    onChange={e=>actualizarCampo("apellido",e.target.value)}
                                    placeholder="Ingrese los apellidos"
                                />
                            </div>

                            <div className="editar-campo">
                                <label>Documento de identidad <span>*</span></label>
                                <input
                                    value={usuario.carnetIdentidad}
                                    onChange={e=>actualizarCampo("carnetIdentidad",e.target.value)}
                                    placeholder="Ingrese el C.I."
                                />
                            </div>

                            <div className="editar-campo">
                                <label>Correo electrónico <span>*</span></label>
                                <input
                                    type="email"
                                    value={usuario.correo}
                                    onChange={e=>actualizarCampo("correo",e.target.value)}
                                    placeholder="ejemplo@correo.com"
                                />
                            </div>

                            <div className="editar-campo">
                                <label>Teléfono</label>
                                <input
                                    value={usuario.celular}
                                    onChange={e=>actualizarCampo("celular",e.target.value)}
                                    placeholder="Ingrese el teléfono"
                                />
                            </div>

                            <div className="editar-campo">
                                <label>Carrera</label>
                                <input
                                    value={usuario.carrera}
                                    onChange={e=>actualizarCampo("carrera",e.target.value)}
                                    placeholder="Ingrese la carrera"
                                />
                            </div>
                        </div>
                    </section>

                    <section className="editar-panel">
                        <div className="editar-panel-cabecera">
                            <div>
                                <h3>Información de acceso</h3>
                                <p>Control de rol y estado de la cuenta.</p>
                            </div>
                        </div>

                        <div className="editar-grid editar-grid-acceso">
                            <div className="editar-campo">
                                <label>Rol <span>*</span></label>
                                <select
                                    value={usuario.idRol}
                                    onChange={e=>actualizarCampo("idRol",Number(e.target.value))}
                                >
                                    <option value="">Seleccione un rol</option>
                                    {roles.map(rol=>(
                                        <option key={rol.idRol} value={rol.idRol}>
                                            {rol.nombreRol}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="editar-campo">
                                <label>Estado <span>*</span></label>
                                <select
                                    value={String(usuario.activo)}
                                    onChange={e=>actualizarCampo("activo",e.target.value==="true")}
                                >
                                    <option value="true">Activo</option>
                                    <option value="false">Inactivo</option>
                                </select>
                            </div>
                        </div>

                        <div className={`editar-estado-cuenta ${usuario.activo?"cuenta-activa":"cuenta-inactiva"}`}>
                            <div className="editar-estado-icono">{usuario.activo?"✓":"!"}</div>
                            <div>
                                <strong>{usuario.activo?"Cuenta habilitada":"Cuenta deshabilitada"}</strong>
                                <p>
                                    {usuario.activo
                                        ?"El usuario puede acceder normalmente al sistema."
                                        :"El usuario no podrá iniciar sesión mientras permanezca inactivo."}
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="editar-panel editar-panel-academico">
                        <div className="editar-panel-cabecera">
                            <div>
                                <h3>Información académica</h3>
                                <p>Información universitaria y materias asociadas.</p>
                            </div>
                        </div>

                        <div className="editar-academico-superior">
                            <div className="editar-campo">
                                <label>Código universitario</label>
                                <input
                                    value={usuario.codigoSis}
                                    onChange={e=>actualizarCampo("codigoSis",e.target.value)}
                                    placeholder="Ingrese el código SIS"
                                />
                            </div>
                        </div>

                        <div className="editar-materias">
                            <div className="editar-materias-cabecera">
                                <div>
                                    <h4>Materias y grupos</h4>
                                    <p>Materias actualmente asociadas al usuario.</p>
                                </div>
                                <span className="editar-contador">
                                    {materias.length} {materias.length===1?"materia":"materias"}
                                </span>
                            </div>

                            {materias.length===0?(
                                <div className="editar-sin-materias">
                                    <div className="editar-sin-icono">▤</div>
                                    <div>
                                        <strong>Sin materias asociadas</strong>
                                        <p>Este usuario no tiene materias registradas actualmente.</p>
                                    </div>
                                </div>
                            ):(
                                <div className="editar-tabla-materias">
                                    <div className="editar-tabla-cabecera">
                                        <span>Materia</span>
                                        <span>Grupo</span>
                                    </div>

                                    {materias.map(materia=>(
                                        <div className="editar-materia-fila" key={materia.idMateria}>
                                            <span className="editar-nombre-materia">
                                                {materia.nombreMateria}
                                            </span>
                                            <span className="editar-grupo-badge">
                                                Grupo {materia.grupo}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <p className="editar-ayuda-materias">
                                Las materias mostradas corresponden a las asignadas al usuario como docente en la base de datos actual.
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
                            {guardando?"Guardando...":"✓ Guardar cambios"}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}

export default EditarUsuario;