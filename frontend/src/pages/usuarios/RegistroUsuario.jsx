import "./RegistroUsuario.css";

import {
    useEffect,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import {
    FiUser,
    FiLock,
    FiPhone,
    FiX,
    FiSave,
    FiCreditCard,
    FiMail,
    FiUsers,
    FiCheckCircle,
    FiList,
    FiUserPlus
} from "react-icons/fi";

import {
    registrarUsuario
} from "../../services/usuarioService";

import {
    obtenerRoles
} from "../../services/rolService";

import {
    useAuth
} from "../../context/useAuth";


const ROLES_REGISTRO = [
    { idRol: 1, nombre: "Administrador" },
    { idRol: 2, nombre: "Docente" },
    { idRol: 3, nombre: "Estudiante" },
    { idRol: 5, nombre: "Personal de ingreso" }
];


const CARRERAS = [
    "Ingeniería de Sistemas",
    "Ingeniería Informática",
    "Ingeniería Industrial",
    "Ingeniería Civil",
    "Ingeniería Eléctrica",
    "Ingeniería Mecánica",
    "Lic. en Administración",
    "Lic. en Contaduría Pública",
    "Medicina",
    "Derecho",
    "Arquitectura",
    "Lic. en Sociología"
];


function Campo(
    {
        etiqueta,
        requerido,
        error,
        children
    }
){

    return (

        <div className="campo-formulario">

            <label className="campo-etiqueta">

                {etiqueta}

                {
                requerido && (
                    <span className="campo-requerido">
                        *
                    </span>
                )
                }

            </label>

            {children}

            {
            error && (
                <span className="campo-error">
                    {error}
                </span>
            )
            }

        </div>

    );

}



const ESTADO_INICIAL = {
    nombre: "",
    apellido: "",
    carnetIdentidad: "",
    correo: "",
    telefono: "",
    idRol: "",
    activo: true,
    codigoSis: "",
    carrera: ""
};



function RegistroUsuario(){


    const navigate = useNavigate();

    const { usuario } = useAuth();


    const [roles,setRoles] = useState([]);

    const rolesRegistro =
        ROLES_REGISTRO
            .map(
                opcion => {

                    const rol =
                        roles.find(
                            rolExistente =>
                                rolExistente.idRol === opcion.idRol
                        );

                    return rol
                        ? { ...rol, nombreRol: opcion.nombre }
                        : null;

                }
            )
            .filter(Boolean);

    const [formulario,setFormulario] =
        useState(ESTADO_INICIAL);

    const [errores,setErrores] = useState({});

    const [errorGeneral,setErrorGeneral] = useState("");

    const [guardando,setGuardando] = useState(false);

    const [usuarioRegistrado,setUsuarioRegistrado] =
        useState(null);

    const [mostrarExito,setMostrarExito] = useState(false);



    const rolSeleccionado =
        roles.find(
            rol =>
                rol.idRol === formulario.idRol
        );

    const esEstudiante =
        Boolean(
            rolSeleccionado &&
            rolSeleccionado.nombreRol &&
            String(
                rolSeleccionado.nombreRol
            ).toLowerCase().includes("estudiante")
        );



    useEffect(()=>{

        obtenerRoles()
            .then(
                respuesta =>
                    setRoles(respuesta.data)
            )
            .catch(
                error => {
                    console.error(
                        "Error cargando roles:",
                        error
                    );
                    setErrorGeneral(
                        "No se pudieron cargar los roles del sistema"
                    );
                }
            );

    },[]);



    const cambiar = (campo,valor) => {

        setFormulario(
            prev => ({
                ...prev,
                [campo]: valor
            })
        );

        setErrores(
            prev => {
                const nuevo = { ...prev };
                delete nuevo[campo];
                return nuevo;
            }
        );

    };



    const validarFormulario = () => {

        const erroresValidos = {};


        if(!formulario.nombre.trim()){

            erroresValidos.nombre =
                "El nombre es obligatorio";

        }


        if(!formulario.apellido.trim()){

            erroresValidos.apellido =
                "El apellido es obligatorio";

        }


        if(!formulario.carnetIdentidad.trim()){

            erroresValidos.carnetIdentidad =
                "El documento de identidad es obligatorio";

        }
        else if(
            !/^[0-9]+$/.test(
                formulario.carnetIdentidad
            )
        ){

            erroresValidos.carnetIdentidad =
                "Solo debe contener números";

        }


        if(!formulario.correo.trim()){

            erroresValidos.correo =
                "El correo electrónico es obligatorio";

        }
        else if(
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                formulario.correo
            )
        ){

            erroresValidos.correo =
                "El correo no tiene un formato válido";

        }


        if(!formulario.idRol){

            erroresValidos.idRol =
                "Debe seleccionar un rol";

        }


        if(
            formulario.telefono.trim()
            && !/^[0-9]+$/.test(
                formulario.telefono.trim()
            )
        ){

            erroresValidos.telefono =
                "Solo debe contener números";

        }


        if(esEstudiante){

            if(!formulario.codigoSis.trim()){

                erroresValidos.codigoSis =
                    "El código universitario es obligatorio";

            }
            else if(!/^\d+$/.test(formulario.codigoSis.trim())){

                erroresValidos.codigoSis =
                    "El código universitario debe contener solo números";

            }

            if(!formulario.carrera){

                erroresValidos.carrera =
                    "Debe seleccionar una carrera";

            }

        }


        return erroresValidos;

    };



    const guardar = async(e) => {

        e.preventDefault();

        setErrorGeneral("");


        const erroresValidacion =
            validarFormulario();


        if(
            Object.keys(erroresValidacion).length > 0
        ){

            setErrores(erroresValidacion);

            return;

        }


        const datos = {
            nombre: formulario.nombre.trim(),
            apellido: formulario.apellido.trim(),
            carnetIdentidad:
                formulario.carnetIdentidad.trim(),
            correo: formulario.correo.trim(),
            celular:
                formulario.telefono.trim() || null,
            idRol: formulario.idRol,
            activo: formulario.activo
        };


        if(esEstudiante){

            datos.codigoSis =
                formulario.codigoSis.trim();

            datos.carrera =
                formulario.carrera;

        }


        try{

            setGuardando(true);

            const respuesta =
                await registrarUsuario(
                    datos,
                    usuario?.idUsuario
                );

            setUsuarioRegistrado(
                respuesta.data
            );

            setMostrarExito(true);

        }
        catch(error){


            const erroresServidor = {};


            const respuesta =
                error.response?.data;


            if(
                respuesta?.errores &&
                Array.isArray(respuesta.errores)
            ){


                respuesta.errores.forEach(
                    errorCampo => {

                        erroresServidor[
                            errorCampo.campo ||
                            "errorGeneral"
                        ] = errorCampo.mensaje;

                    }
                );


                setErrores(erroresServidor);

            }
            else if(respuesta?.mensaje){

                setErrorGeneral(
                    respuesta.mensaje
                );

            }
            else{

                setErrorGeneral(
                    "No se pudo registrar el usuario. " +
                    "Verifique la conexión e intente nuevamente."
                );

            }


        }
        finally{

            setGuardando(false);

        }

    };


    const registrarOtroUsuario = () => {

        setMostrarExito(false);

        setUsuarioRegistrado(null);

        setFormulario(ESTADO_INICIAL);

        setErrores({});

    };



    return (

        <div className="registro-usuario">

            <nav className="registro-migas">

                <span
                    className="registro-migas-enlace"
                    onClick={
                        () =>
                        navigate("/")
                    }
                >
                    Inicio
                </span>

                <span className="registro-migas-separador">
                    &gt;
                </span>

                <span
                    className="registro-migas-enlace"
                    onClick={
                        () =>
                        navigate("/usuarios")
                    }
                >
                    Usuarios
                </span>

                <span className="registro-migas-separador">
                    &gt;
                </span>

                <span className="registro-migas-actual">
                    Registrar usuario
                </span>

            </nav>


            <div className="registro-cabecera">

                <h1 className="registro-titulo">
                    Registrar usuario
                </h1>

                <p className="registro-subtitulo">
                    Complete la información del usuario para
                    registrarlo en el sistema.
                </p>

            </div>


            {
            errorGeneral && (
                <p className="registro-alerta registro-alerta-error">
                    {errorGeneral}
                </p>
            )
            }


            <form
                className="registro-tarjeta"
                onSubmit={guardar}
                noValidate
            >

                <section className="registro-seccion">

                    <div className="registro-cabecera-seccion">

                        <span className="registro-cabecera-seccion-icono">
                            <FiUser />
                        </span>

                        <h2 className="registro-seccion-titulo">
                            Información personal
                        </h2>

                    </div>


                    <div className="registro-grid">

                        <Campo
                            etiqueta="Nombres"
                            requerido
                            error={errores.nombre}
                        >

                            <input
                                className="registro-input"
                                value={formulario.nombre}
                                onChange={
                                    e =>
                                    cambiar(
                                        "nombre",
                                        e.target.value
                                    )
                                }
                                placeholder="Ingrese nombres"
                            />

                        </Campo>


                        <Campo
                            etiqueta="Apellidos"
                            requerido
                            error={errores.apellido}
                        >

                            <input
                                className="registro-input"
                                value={formulario.apellido}
                                onChange={
                                    e =>
                                    cambiar(
                                        "apellido",
                                        e.target.value
                                    )
                                }
                                placeholder="Ingrese apellidos"
                            />

                        </Campo>


                        <Campo
                            etiqueta="Documento de identidad"
                            requerido
                            error={
                                errores.carnetIdentidad
                            }
                        >

                            <input
                                className="registro-input"
                                value={
                                    formulario.carnetIdentidad
                                }
                                onChange={
                                    e =>
                                    cambiar(
                                        "carnetIdentidad",
                                        e.target.value
                                    )
                                }
                                placeholder="Ingrese documento"
                            />

                        </Campo>


                        <Campo
                            etiqueta="Correo electrónico"
                            requerido
                            error={errores.correo}
                        >

                            <input
                                className="registro-input"
                                type="email"
                                value={formulario.correo}
                                onChange={
                                    e =>
                                    cambiar(
                                        "correo",
                                        e.target.value
                                    )
                                }
                                placeholder="Ingrese correo electrónico"
                            />

                        </Campo>


                        <Campo
                            etiqueta="Teléfono"
                            requerido
                            error={errores.celular}
                        >

                            <div className="registro-campo-con-icono">

                                <span className="registro-icono-input">
                                    <FiPhone />
                                </span>

                                <input
                                    className="registro-input"
                                    value={formulario.telefono}
                                    onChange={
                                        e =>
                                        cambiar(
                                            "telefono",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Ingrese número de teléfono"
                                />

                            </div>

                        </Campo>

                    </div>

                </section>


                <div className="registro-separador" />


                <section className="registro-seccion">

                    <div className="registro-cabecera-seccion">

                        <span className="registro-cabecera-seccion-icono">
                            <FiLock />
                        </span>

                        <h2 className="registro-seccion-titulo">
                            Información de acceso
                        </h2>

                    </div>


                    <div className="registro-grid">

                        <Campo
                            etiqueta="Rol"
                            requerido
                            error={errores.idRol}
                        >

                            <select
                                className="registro-input"
                                value={
                                    formulario.idRol || ""
                                }
                                onChange={
                                    e =>
                                    cambiar(
                                        "idRol",
                                        Number(e.target.value)
                                    )
                                }
                            >

                                <option value="">
                                    Seleccione un rol
                                </option>


                                {
                                    rolesRegistro.map(
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

                        </Campo>


                        <Campo
                            etiqueta="Estado"
                            requerido
                        >

                            <select
                                className="registro-input"
                                value={
                                    String(formulario.activo)
                                }
                                onChange={
                                    e =>
                                    cambiar(
                                        "activo",
                                        e.target.value === "true"
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

                        </Campo>

                    </div>


                    {
                    esEstudiante && (

                        <div className="registro-tarjeta-estudiante">

                            <h3 className="registro-tarjeta-estudiante-titulo">
                                Información adicional
                                (solo para estudiantes)
                            </h3>


                            <div className="registro-grid">

                                <Campo
                                    etiqueta="Código universitario"
                                    requerido
                                    error={errores.codigoSis}
                                >

                                    <input
                                        className="registro-input"
                                        value={formulario.codigoSis}
                                        onChange={
                                            e =>
                                            cambiar(
                                                "codigoSis",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Ingrese código universitario"
                                    />

                                </Campo>


                                <Campo
                                    etiqueta="Carrera"
                                    requerido
                                    error={errores.carrera}
                                >

                                    <select
                                        className="registro-input"
                                        value={formulario.carrera}
                                        onChange={
                                            e =>
                                            cambiar(
                                                "carrera",
                                                e.target.value
                                            )
                                        }
                                    >

                                        <option value="">
                                            Seleccione una carrera
                                        </option>


                                        {
                                            CARRERAS.map(
                                                carrera => (
                                                    <option
                                                        key={carrera}
                                                        value={carrera}
                                                    >
                                                        {carrera}
                                                    </option>
                                                )
                                            )
                                        }

                                    </select>

                                </Campo>

                            </div>

                        </div>

                    )
                    }


                </section>


                <div className="registro-acciones">

                    <button
                        type="button"
                        className="registro-boton registro-boton-cancelar"
                        onClick={
                            () =>
                            navigate("/usuarios")
                        }
                    >
                        <FiX />

                        Cancelar
                    </button>

                    <button
                        type="submit"
                        className="registro-boton registro-boton-guardar"
                        disabled={guardando}
                    >
                        <FiSave />

                        {
                        guardando
                            ? "Guardando..."
                            : "Guardar usuario"
                        }

                    </button>

                </div>

            </form>


            {
            mostrarExito && usuarioRegistrado && (

                <div className="registro-modal-fondo">

                    <div className="registro-modal-exito">

                        <div className="registro-modal-icono">
                            ✓
                        </div>

                        <h2 className="registro-modal-titulo">
                            Usuario registrado correctamente
                        </h2>

                        <p className="registro-modal-descripcion">
                            El usuario ha sido registrado en el sistema
                            de forma exitosa.
                        </p>


                        <div className="registro-modal-tarjeta">

                            <div className="registro-modal-tarjeta-titulo">
                                <FiUser />
                                Datos del usuario registrado
                            </div>

                            <div className="registro-modal-dato">
                                <FiUser />
                                <span className="registro-modal-dato-etiqueta">
                                    Nombres y apellidos
                                </span>
                                <span className="registro-modal-dato-valor">
                                    {
                                    usuarioRegistrado.nombre +
                                    " " +
                                    usuarioRegistrado.apellido
                                    }
                                </span>
                            </div>

                            <div className="registro-modal-dato">
                                <FiCreditCard />
                                <span className="registro-modal-dato-etiqueta">
                                    Documento de identidad
                                </span>
                                <span className="registro-modal-dato-valor">
                                    {usuarioRegistrado.carnetIdentidad}
                                </span>
                            </div>

                            <div className="registro-modal-dato">
                                <FiMail />
                                <span className="registro-modal-dato-etiqueta">
                                    Correo electrónico
                                </span>
                                <span className="registro-modal-dato-valor">
                                    {usuarioRegistrado.correo}
                                </span>
                            </div>

                            <div className="registro-modal-dato">
                                <FiPhone />
                                <span className="registro-modal-dato-etiqueta">
                                    Teléfono
                                </span>
                                <span className="registro-modal-dato-valor">
                                    {usuarioRegistrado.celular || "—"}
                                </span>
                            </div>

                            <div className="registro-modal-dato">
                                <FiUsers />
                                <span className="registro-modal-dato-etiqueta">
                                    Rol asignado
                                </span>
                                <span className="registro-modal-chip">
                                    {usuarioRegistrado.nombreRol}
                                </span>
                            </div>

                            <div className="registro-modal-dato">
                                <FiCheckCircle />
                                <span className="registro-modal-dato-etiqueta">
                                    Estado
                                </span>
                                <span className="registro-modal-chip">
                                    {
                                    usuarioRegistrado.activo
                                        ? "Activo"
                                        : "Inactivo"
                                    }
                                </span>
                            </div>

                        </div>


                        <div className="registro-modal-acciones">

                            <button
                                type="button"
                                className="registro-modal-boton registro-modal-boton-ver"
                                onClick={() => navigate("/usuarios")}
                            >
                                <FiList />
                                Ver usuarios
                            </button>

                            <button
                                type="button"
                                className="registro-modal-boton registro-modal-boton-otro"
                                onClick={registrarOtroUsuario}
                            >
                                <FiUserPlus />
                                Registrar otro usuario
                            </button>

                        </div>

                    </div>

                </div>

            )
            }

        </div>

    );

}


export default RegistroUsuario;