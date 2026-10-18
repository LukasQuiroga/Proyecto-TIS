import "./AccesoDenegado.css";

import {
    useNavigate
} from "react-router-dom";

import {
    FiLock,
    FiArrowLeft
} from "react-icons/fi";

function AccesoDenegado(){

    const navigate = useNavigate();

    return (

        <div className="acceso-denegado">

            <div className="acceso-denegado-tarjeta">

                <span className="acceso-denegado-icono">
                    <FiLock />
                </span>

                <h1>
                    Sin autorización
                </h1>

                <p>
                    No tiene permisos para acceder a esta sección.
                    Contacte al administrador del sistema si considera
                    que esto es un error.
                </p>

                <button
                    type="button"
                    className="acceso-denegado-boton"
                    onClick={() => navigate("/")}
                >
                    <FiArrowLeft />
                    Volver al inicio
                </button>

            </div>

        </div>

    );

}

export default AccesoDenegado;