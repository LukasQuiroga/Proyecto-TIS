import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";


function Login() {


    const navigate = useNavigate();


    const [correo, setCorreo] = useState("");
    const [password, setPassword] = useState("");



    const handleLogin = (e) => {

        e.preventDefault();

        // Login temporal frontend
        navigate("/");

    };



    return (


        <div className="login-page">



            <div className="login-card">




                <h1>
                    Acceso al sistema
                </h1>



                <p className="login-description">

                    Ingresa tus credenciales para continuar.

                </p>





                <form onSubmit={handleLogin}>


                    <label>
                        Correo electrónico
                    </label>



                    <div className="input-container">


                        <input

                            type="email"

                            placeholder="202001068@edu.est.umss"

                            value={correo}

                            onChange={(e)=>setCorreo(e.target.value)}

                        />


                    </div>







                    <label>
                        Contraseña
                    </label>



                    <div className="input-container">

                        <input

                            type="password"

                            placeholder="Ingresa tu contraseña"

                            value={password}

                            onChange={(e)=>setPassword(e.target.value)}

                        />


                        <span className="eye">

                            ◉

                        </span>


                    </div>






                    <div className="login-options">


                        <label className="remember">


                            <input type="checkbox"/>


                            Recordarme


                        </label>





                        <a href="#">

                            ¿Olvidaste tu contraseña?

                        </a>



                    </div>







                    <button

                        className="btn-login"

                        type="submit"

                    >

                        Iniciar sesión

                        <span>
                            →
                        </span>


                    </button>




                </form>




            </div>







            <footer className="login-footer">


                <span>

                    Sistema de Control de Ingreso a Exámenes Masivos

                </span>


                <span>

                    © 2026. Todos los derechos reservados.

                </span>


            </footer>




        </div>


    );

}



export default Login;