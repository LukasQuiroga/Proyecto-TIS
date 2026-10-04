import {
    useEffect,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import {
    solicitarRecuperacion
} from "../../services/authService";

import "./RecuperacionContrasena.css";


function RecuperarContrasena(){

    const navigate = useNavigate();

    const [correo,setCorreo] = useState("");
    const [mensaje,setMensaje] = useState("");
    const [error,setError] = useState("");
    const [solicitudProcesada,setSolicitudProcesada] =
        useState(false);

    const [segundosRestantes,setSegundosRestantes] =
        useState(0);


    useEffect(()=>{

        if(segundosRestantes <= 0){

            return undefined;
        }


        const timer =
            window.setTimeout(()=>{

                setSegundosRestantes(
                    actual =>
                        Math.max(
                            0,
                            actual - 1
                        )
                );

            },1000);


        return ()=>{

            window.clearTimeout(
                timer
            );

        };

    },[segundosRestantes]);


    const enviarCodigo = async(e)=>{

        e.preventDefault();

        setError("");
        setMensaje("");
        setSolicitudProcesada(false);


        if(segundosRestantes > 0){

            return;
        }


        if(!correo.trim()){

            setError(
                "El correo electrónico es obligatorio"
            );

            return;
        }


        try{

            const respuesta =
                await solicitarRecuperacion(
                    correo.trim()
                );


            localStorage.setItem(
                "correoRecuperacion",
                correo.trim()
            );


            setMensaje(
                respuesta?.mensaje ||
                "Si el correo ingresado se encuentra registrado, recibirás un código para recuperar tu contraseña."
            );


            setSolicitudProcesada(
                true
            );


            setSegundosRestantes(
                60
            );


        }catch(error){

            setError(
                error.response?.data?.mensaje ||
                error.response?.data?.message ||
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
                    Ingresa tu correo electrónico para solicitar un código de recuperación.
                </p>


                <form
                    onSubmit={
                        enviarCodigo
                    }
                >

                    <label>
                        Correo electrónico
                    </label>


                    <input
                        type="email"
                        placeholder="correo@ejemplo.com"
                        value={correo}
                        onChange={
                            e=>setCorreo(
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


                    <button
                        type="submit"
                        disabled={
                            segundosRestantes > 0
                        }
                    >

                        {
                            segundosRestantes > 0
                                ? `Reenviar en ${segundosRestantes}s`
                                : "Enviar código"
                        }

                    </button>

                </form>


                {
                    solicitudProcesada &&
                    <button
                        type="button"
                        className="continuar"
                        onClick={
                            ()=>navigate(
                                "/verificar-codigo"
                            )
                        }
                    >
                        Ya tengo el código
                    </button>
                }


                <button
                    type="button"
                    className="volver"
                    onClick={
                        ()=>navigate(
                            "/login"
                        )
                    }
                >
                    Volver al inicio
                </button>

            </div>

        </div>

    );

}

export default RecuperarContrasena;