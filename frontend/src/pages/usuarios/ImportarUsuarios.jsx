import { useNavigate } from "react-router-dom";
import "./Usuarios.css";


function ImportarUsuarios(){

    const navigate = useNavigate();


    return (

        <div className="usuarios-pagina">

            <header className="usuarios-encabezado">

                <div>

                    <h1>
                        Importar usuarios
                    </h1>

                    <p>
                        Importa usuarios mediante un archivo CSV.
                    </p>

                </div>

            </header>


            <section className="usuarios-panel">

                <p>
                    Selección de archivo CSV.
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


export default ImportarUsuarios;