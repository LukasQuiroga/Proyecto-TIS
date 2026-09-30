import { useNavigate } from "react-router-dom";
import "./Usuarios.css";

function ImportarUsuarios() {
    const navigate = useNavigate();

    return (
        <div className="usuarios-pagina">
            <header className="usuarios-encabezado">
                <div>
                    <h1>Importar usuarios</h1>
                    <p>
                        Registra usuarios de forma masiva mediante un archivo CSV.
                    </p>
                </div>
            </header>

            <section className="usuarios-panel">
                <div className="usuarios-importacion">
                    <div className="usuarios-zona-archivo">
                        <div className="usuarios-icono-archivo">
                            CSV
                        </div>

                        <h2>Importar archivo CSV</h2>

                        <p>
                            Seleccione o arrastre un archivo CSV para comenzar
                            la importación.
                        </p>

                        <button
                            type="button"
                            className="usuarios-boton-seleccionar"
                        >
                            Seleccionar archivo
                        </button>

                        <span className="usuarios-ayuda-archivo">
                            Formato permitido: .csv
                        </span>
                    </div>

                    <div className="usuarios-formulario-acciones">
                        <button
                            type="button"
                            className="usuarios-boton-cancelar"
                            onClick={() => navigate("/usuarios/registrar")}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default ImportarUsuarios;