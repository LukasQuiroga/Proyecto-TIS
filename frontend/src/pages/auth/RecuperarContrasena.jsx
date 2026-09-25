import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  solicitarRecuperacion
} from "../../services/authService";

import "./RecuperacionContrasena.css";


function RecuperarContrasena() {

    const navigate = useNavigate();

    const [correo, setCorreo] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [error, setError] = useState("");



    const enviarCodigo = async (e) => {

        e.preventDefault();

        setError("");
        setMensaje("");


        if(!correo){
            setError("El correo electrónico es obligatorio");
            return;
        }


        try {

            await solicitarRecuperacion(correo);


            localStorage.setItem(
                "correoRecuperacion",
                correo
            );


            setMensaje(
                "Código enviado correctamente"
            );


            setTimeout(()=>{

                navigate("/verificar-codigo");

            },1000);


        } catch(error){

            setError(
                "No se pudo procesar la solicitud"
            );
        }

    };



    return (

        <div className="recuperacion-page">


            <div className="recuperacion-card">


                <h2>
                    Recuperar contraseña
                </h2>


                <p>
                    Ingresa tu correo electrónico registrado
                    para recibir un código de recuperación.
                </p>



                <form onSubmit={enviarCodigo}>


                    <label>
                        Correo electrónico
                    </label>


                    <input
                        type="email"
                        placeholder="correo@ejemplo.com"
                        value={correo}
                        onChange={
                            e=>setCorreo(e.target.value)
                        }
                    />



                    {
                        error &&
                        <span className="error">
                            {error}
                        </span>
                    }


                    {
                        mensaje &&
                        <span className="success">
                            {mensaje}
                        </span>
                    }



                    <button>
                        Enviar código
                    </button>



                </form>


                <button
                    className="volver"
                    onClick={()=>navigate("/login")}
                >
                    Volver al inicio
                </button>



            </div>


        </div>

    );

}


export default RecuperarContrasena;