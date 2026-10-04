import {useState} from "react";
import {Navigate,useNavigate} from "react-router-dom";
import {FaEye,FaEyeSlash} from "react-icons/fa";
import "./Login.css";
import {login} from "../../services/authService";
import {useAuth} from "../../context/useAuth";

function Login(){

    const navigate=useNavigate();

    const {
        usuario,
        token,
        iniciarSesion
    }=useAuth();

    const [correo,setCorreo]=useState("");
    const [password,setPassword]=useState("");
    const [mostrar,setMostrar]=useState(false);
    const [cargando,setCargando]=useState(false);

    const [modal,setModal]=useState({
        mostrar:false,
        tipo:""
    });

    if(usuario && token && !modal.mostrar){
        return <Navigate to="/" replace/>;
    }

    async function manejarLogin(e){

        e.preventDefault();

        if(!correo || !password){

            setModal({
                mostrar:true,
                tipo:"error"
            });

            return;
        }

        if(!navigator.onLine){

            setModal({
                mostrar:true,
                tipo:"conexion"
            });

            return;
        }

        try{

            setCargando(true);

            const respuesta=await login(
                correo,
                password
            );

            iniciarSesion(
                respuesta.usuario,
                respuesta.token,
                false
            );

            setModal({
                mostrar:true,
                tipo:"success"
            });

            setTimeout(()=>{

                navigate("/",{
                    replace:true
                });

            },2000);

        }catch(error){

            console.error(
                "ERROR LOGIN:",
                error
            );

            const errorConexion=
                !navigator.onLine ||
                error.code==="ERR_NETWORK" ||
                error.code==="ECONNABORTED" ||
                !error.response;

            setModal({
                mostrar:true,
                tipo:errorConexion
                    ?"conexion"
                    :"error"
            });

        }finally{

            setCargando(false);
        }
    }

    const esError=
        modal.tipo==="error";

    const esConexion=
        modal.tipo==="conexion";

    const esExito=
        modal.tipo==="success";

    return(

        <div className="login-page">

            <div className="login-card">

                <h1>
                    Acceso al sistema
                </h1>

                <p className="login-description">
                    Ingresa tus credenciales para continuar.
                </p>

                <form onSubmit={manejarLogin}>

                    <label>
                        Correo electrónico
                    </label>

                    <div className="input-container">

                        <input
                            type="email"
                            value={correo}
                            maxLength={50}
                            placeholder="202001068@edu.est.umss"
                            onChange={(e)=>
                                setCorreo(
                                    e.target.value.slice(0,50)
                                )
                            }
                        />

                    </div>

                    <label>
                        Contraseña
                    </label>

                    <div className="input-container">

                        <input
                            type={mostrar?"text":"password"}
                            value={password}
                            maxLength={20}
                            placeholder="Ingresa tu contraseña"
                            onChange={(e)=>
                                setPassword(
                                    e.target.value.slice(0,20)
                                )
                            }
                        />

                        <span
                            className="eye"
                            onClick={()=>
                                setMostrar(!mostrar)
                            }
                        >
                            {
                                mostrar
                                    ?<FaEyeSlash/>
                                    :<FaEye/>
                            }
                        </span>

                    </div>

                    <div className="login-options">

                        <button
                            type="button"
                            className="forgot-password"
                            onClick={()=>
                                navigate(
                                    "/recuperar-contrasena"
                                )
                            }
                        >
                            ¿Olvidaste tu contraseña?
                        </button>

                    </div>

                    <button
                        type="submit"
                        className="btn-login"
                        disabled={cargando}
                    >
                        {
                            cargando
                                ?"Procesando..."
                                :"Iniciar sesión →"
                        }
                    </button>

                    <button
                        type="button"
                        className="btn-volver"
                        onClick={()=>
                            navigate("/")
                        }
                    >
                        ← Volver al inicio
                    </button>

                </form>

            </div>

            {
                modal.mostrar &&

                <div className="login-modal-fondo">

                    <div className="login-modal">

                        <div
                            className={
                                esExito
                                    ?"login-modal-icon login-modal-success"
                                    :"login-modal-icon login-modal-error"
                            }
                        >
                            {
                                esExito
                                    ?"✓"
                                    :"!"
                            }
                        </div>

                        <h2>
                            {
                                esConexion
                                    ?"Sin conexión"
                                    :esError
                                        ?"Credenciales incorrectas"
                                        :"Acceso exitoso"
                            }
                        </h2>

                        <p>
                            {
                                esConexion
                                    ?"No se pudo conectar con el sistema. Verifica tu conexión a Internet e intenta nuevamente."
                                    :esError
                                        ?"Verifica tu correo electrónico y contraseña e intenta nuevamente."
                                        :"Bienvenido al sistema. Redirigiendo..."
                            }
                        </p>

                        {
                            !esExito
                                ?

                                <button
                                    type="button"
                                    onClick={()=>
                                        setModal({
                                            mostrar:false,
                                            tipo:""
                                        })
                                    }
                                >
                                    Aceptar
                                </button>

                                :

                                <div className="login-progreso"></div>
                        }

                    </div>

                </div>
            }

        </div>
    );
}

export default Login;