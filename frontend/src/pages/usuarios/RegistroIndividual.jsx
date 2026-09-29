import { useNavigate } from "react-router-dom";
import "./Usuarios.css";


function RegistroIndividual(){

    const navigate = useNavigate();


    return (

        <div className="usuarios-pagina">

            <header className="usuarios-encabezado">

                <div>

                    <h1>
                        Registro individual
                    </h1>

                    <p>
                        Registra un nuevo usuario en el sistema.
                    </p>

                </div>

            </header>


            <section className="usuarios-panel">

                <p>
                    Formulario de registro individual.
                </p>

                <button
                    className="usuarios-boton-nuevo"
                    onClick={() => navigate("/usuarios/registrar")}
                >
                    Volver
                </button>

            </section>

        </div>

    );

}


export default RegistroIndividual;