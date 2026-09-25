import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Login.css";

import { login } from "../../services/authService";
import { useAuth } from "../../context/useAuth";



function Login(){


    const navigate = useNavigate();


    const { iniciarSesion } = useAuth();




    const [correo, setCorreo] = useState("");

    const [password, setPassword] = useState("");

    const [mostrar, setMostrar] = useState(false);

    const [recordar, setRecordar] = useState(false);

    const [error, setError] = useState("");

    const [cargando, setCargando] = useState(false);





    async function manejarLogin(e){


        e.preventDefault();


        setError("");



        if(!correo || !password){


            setError(
                "Debe completar todos los campos."
            );


            return;

        }




        try{


            setCargando(true);



            const respuesta = await login(
                correo,
                password
            );



            iniciarSesion(
                respuesta.usuario,
                recordar
            );



            navigate("/");



        }
        catch{


            setError(
                "Credenciales incorrectas."
            );


        }
        finally{


            setCargando(false);


        }


    }





    return (


        <div className="login-page">



            <div className="login-card">



                <h1>
                    Acceso al sistema
                </h1>




                <p className="login-description">

                    Ingresa tus credenciales para continuar.

                </p>





                {
                    error &&

                    <div className="login-error">

                        {error}

                    </div>

                }





                <form onSubmit={manejarLogin}>


                    <label>
                        Correo electrónico
                    </label>



                    <div className="input-container">


                        <input

                            type="email"

                            value={correo}

                            placeholder="202001068@edu.est.umss"

                            onChange={
                                (e)=>setCorreo(e.target.value)
                            }

                        />


                    </div>






                    <label>
                        Contraseña
                    </label>




                    <div className="input-container">


                        <input


                            type={
                                mostrar
                                ?
                                "text"
                                :
                                "password"
                            }


                            value={password}


                            placeholder="Ingresa tu contraseña"


                            onChange={
                                (e)=>setPassword(e.target.value)
                            }


                        />





                        <span

                            className="eye"

                            onClick={
                                ()=>setMostrar(!mostrar)
                            }

                        >

                            ◉

                        </span>



                    </div>








                    <div className="login-options">



                        <label className="remember">


                            <input


                                type="checkbox"


                                checked={recordar}


                                onChange={
                                    (e)=>setRecordar(e.target.checked)
                                }


                            />


                            Recordarme


                        </label>







                        <button

                            type="button"

                            className="forgot-password"

                            onClick={
                                ()=>navigate("/recuperar-contrasena")
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

                            ?

                            "Procesando..."

                            :

                            "Iniciar sesión →"

                        }



                    </button>






                    <button

                        type="button"

                        className="btn-volver"

                        onClick={() => navigate("/")}

                    >

                        ← Volver al inicio


                    </button>





                </form>




            </div>




        </div>


    );


}



export default Login;