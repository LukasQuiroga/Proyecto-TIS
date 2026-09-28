import { useNavigate } from "react-router-dom";
import "./Usuarios.css";


function RegistrarUsuario(){

    const navigate = useNavigate();


    return (

        <div className="usuarios-pagina">

            <header className="usuarios-encabezado">

                <div>
                    <h1>
                        Registrar usuario
                    </h1>

                    <p>
                        Seleccione el tipo de registro que desea realizar.
                    </p>
                </div>

            </header>



            <section className="usuarios-panel">


                <button
                    className="usuarios-boton-nuevo"
                    onClick={() => navigate("/usuarios/registrar/individual")}
                >
                    Registrar usuario individual
                </button>



                <button
                    className="usuarios-boton-nuevo"
                    onClick={() => navigate("/usuarios/importar")}
                >
                    Importar usuarios CSV
                </button>


            </section>


        </div>

    );

}


export default RegistrarUsuario;