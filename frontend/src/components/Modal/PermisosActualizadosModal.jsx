import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import "./PermisosActualizadosModal.css";

function PermisosActualizadosModal() {

    const {
        permisosActualizados,
        cerrarSesion,
        setPermisosActualizados
    } = useAuth();

    const navigate = useNavigate();

    if (!permisosActualizados) {
        return null;
    }

    const manejarCerrarSesion = () => {

        setPermisosActualizados(false);

        cerrarSesion();

        navigate("/login");

    };

    return (

        <div className="modal-permisos-fondo">

            <div className="modal-permisos">

                <div className="modal-permisos-icono">
                    !
                </div>

                <h2>
                    Permisos actualizados
                </h2>

                <p>
                    Los permisos de tu cuenta han sido modificados.
                    Debes iniciar sesión nuevamente para aplicar
                    los cambios.
                </p>

                <button
                    onClick={manejarCerrarSesion}
                >
                    Cerrar sesión
                </button>

            </div>

        </div>

    );
}

export default PermisosActualizadosModal;