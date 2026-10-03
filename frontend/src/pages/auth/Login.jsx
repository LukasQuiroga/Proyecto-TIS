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

            console.log(
                "ERROR LOGIN:",
                error
            );

            setModal({
                mostrar:true,
                tipo:"error"
            });

        }finally{

            setCargando(false);

        }

    }

    return(

        <div className="login-page">

            <div className="login-card">

                <h1>Acceso al sistema</h1>

                <p className="login-description">
                    Ingresa tus credenciales para continuar.
                </p>

                <form onSubmit={manejarLogin}>

                    <label>Correo electrónico</label>

                    <div className="input-container">

                        <input
                            type="email"
                            value={correo}
                            placeholder="202001068@edu.est.umss"
                            onChange={(e)=>setCorreo(e.target.value)}
                        />

                    </div>

                    <label>Contraseña</label>

                    <div className="input-container">

                        <input
                            type={mostrar?"text":"password"}
                            value={password}
                            placeholder="Ingresa tu contraseña"
                            onChange={(e)=>setPassword(e.target.value)}
                        />

                        <span
                            className="eye"
                            onClick={()=>setMostrar(!mostrar)}
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

                <div className="modal-fondo">

                    <div className="modal-login">

                        <div
                            className={
                                modal.tipo==="error"
                                    ?"modal-icon modal-error"
                                    :"modal-icon modal-success"
                            }
                        >
                            {
                                modal.tipo==="error"
                                    ?"!"
                                    :"✓"
                            }
                        </div>

                        <h2>
                            {
                                modal.tipo==="error"
                                    ?"Credenciales incorrectas"
                                    :"Acceso exitoso"
                            }
                        </h2>

                        <p>
                            {
                                modal.tipo==="error"
                                    ?"Verifica tu correo electrónico y contraseña e intenta nuevamente."
                                    :"Bienvenido al sistema. Redirigiendo..."
                            }
                        </p>

                        {
                            modal.tipo==="error"
                                ?

                                <button
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

                                <div className="progreso"></div>
                        }

                    </div>

                </div>
            }

        </div>

    );

}

export default Login;