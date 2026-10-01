import { useAuth } from "../../context/useAuth";
import "./Perfil.css";

function Perfil(){

    const {usuario}=useAuth();

    return(

        <div className="perfil-container">

            <div className="perfil-card">

                <div className="perfil-avatar">
                    {usuario?.nombre?.charAt(0) || "U"}
                </div>


                <h2>
                    Mi perfil
                </h2>


                <div className="perfil-datos">

                    <div>
                        <label>Nombre</label>
                        <p>
                        {
                        usuario?.nombre ||
                        usuario?.nombreCompleto ||
                        "No registrado"
                        }
                        </p>
                    </div>


                    <div>
                        <label>Apellido</label>
                        <p>{usuario?.apellido || "No registrado"}</p>
                    </div>


                    <div>
                        <label>Correo electrónico</label>
                        <p>{usuario?.correo || "No registrado"}</p>
                    </div>


                    <div>
                        <label>Rol</label>
                        <p>
                        {
                        usuario?.rol?.nombre ||
                        usuario?.rol ||
                        "Usuario"
                        }
                        </p>
                    </div>

                </div>


            </div>

        </div>

    );

}

export default Perfil;