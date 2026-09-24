import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {

    const navigate = useNavigate();

    const [correo, setCorreo] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = (e) => {
        e.preventDefault();

        navigate("/");
    };


    return (
        <div className="login-container">

            <div className="login-card">

                <div className="login-logo">
                    <div className="logo-icon">
                        ◆
                    </div>

                    <h2>
                        Sistema de Control
                        <br />
                        de Ingreso a Exámenes
                    </h2>
                </div>


                <h1>
                    Inicio de sesión
                </h1>

                <p className="login-description">
                    Ingresa tus credenciales para acceder al sistema.
                </p>


                <form onSubmit={handleLogin}>


                    <label>
                        Correo electrónico
                    </label>

                    <input
                        type="email"
                        placeholder="Ingrese su correo"
                        value={correo}
                        onChange={(e)=>setCorreo(e.target.value)}
                    />



                    <label>
                        Contraseña
                    </label>

                    <input
                        type="password"
                        placeholder="Ingrese su contraseña"
                        value={password}
                        onChange={(e)=>setPassword(e.target.value)}
                    />



                    <button 
                        type="submit"
                        className="btn-login"
                    >
                        Iniciar sesión
                    </button>


                </form>


            </div>

        </div>
    );
}


export default Login;