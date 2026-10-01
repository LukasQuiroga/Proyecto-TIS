import {
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import {
    restablecerContrasena
}
from "../../services/authService";

import "./RecuperacionContrasena.css";


function NuevaContrasena(){

    const navigate = useNavigate();
    const [password,setPassword] = useState("");
    const [confirmar,setConfirmar] = useState("");
    const [mensaje,setMensaje] = useState("");
    const [error,setError] = useState("");
    const cambiarPassword = async(e)=>{

        e.preventDefault();

        setError("");


        if(password !== confirmar){

            setError(
                "Las contraseñas no coinciden"
            );

            return;
        }

        try{

            console.log("DATOS ENVIADOS AL BACKEND:");

            console.log({

                correo:
                localStorage.getItem(
                    "correoRecuperacion"
                ),

                token:
                localStorage.getItem(
                    "tokenRecuperacion"
                ),

                nuevaContrasena:
                password,

                confirmarContrasena:
                confirmar

            });

            await restablecerContrasena({

                correo:
                localStorage.getItem(
                    "correoRecuperacion"
                ),

                token:
                localStorage.getItem(
                    "tokenRecuperacion"
                ),

                nuevaContrasena:
                password,


                confirmarContrasena:
                confirmar
            });

            setMensaje(
                "Contraseña actualizada correctamente"
            );

            localStorage.removeItem(
                "tokenRecuperacion"
            );

            localStorage.removeItem(
                "codigoRecuperacion"
            );

            setTimeout(()=>{

                navigate("/login");

            },1500);

        }catch(error){

            console.error(
                "ERROR AL ACTUALIZAR CONTRASEÑA:",
                error
            );

            setError(
                "No se pudo actualizar la contraseña"
            );

        }

    };

    return (
        <div className="recuperacion-page">

            <div className="recuperacion-card">

                <h2>
                    Nueva contraseña
                </h2>

                <form onSubmit={cambiarPassword}>

                    <input

                        type="password"

                        placeholder="Nueva contraseña"

                        value={password}

                        onChange={
                            e=>setPassword(
                                e.target.value
                            )
                        }

                    />

                    <input

                        type="password"

                        placeholder="Confirmar contraseña"

                        value={confirmar}

                        onChange={
                            e=>setConfirmar(
                                e.target.value
                            )
                        }

                    />


                    {
                        error &&
                        <p className="error">
                            {error}
                        </p>
                    }

                    {
                        mensaje &&
                        <p className="success">
                            {mensaje}
                        </p>
                    }

                    <button>
                        Guardar contraseña
                    </button>

                </form>

            </div>

        </div>
    );

}


export default NuevaContrasena;