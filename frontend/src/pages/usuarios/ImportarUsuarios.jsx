import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Usuarios.css";

function ImportarUsuarios() {
    const navigate = useNavigate();

    const inputArchivoRef = useRef(null);
    const [archivo, setArchivo] = useState(null);
    const [arrastrando, setArrastrando] = useState(false);

    const abrirSelectorArchivo = () => {
        inputArchivoRef.current?.click();
    };

    const manejarSeleccionArchivo = (event) => {
        const archivoSeleccionado = event.target.files[0];

        if (!archivoSeleccionado) {
            return;
        }

        setArchivo(archivoSeleccionado);
    };

    const manejarDragOver = (event) => {
        event.preventDefault();
        setArrastrando(true);
    };

    const manejarDragLeave = (event) => {
        event.preventDefault();
        setArrastrando(false);
    };

    const manejarDrop = (event) => {
        event.preventDefault();
        setArrastrando(false);

        const archivoArrastrado = event.dataTransfer.files[0];

        if (!archivoArrastrado) {
            return;
        }

        setArchivo(archivoArrastrado);
    };

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
                    <div
                        className={`usuarios-zona-archivo ${
                            arrastrando
                                ? "usuarios-zona-archivo-activa"
                                : ""
                        }`}
                        onDragOver={manejarDragOver}
                        onDragLeave={manejarDragLeave}
                        onDrop={manejarDrop}
                    >
                        <div className="usuarios-icono-archivo">
                            CSV
                        </div>

                        <h2>Importar archivo CSV</h2>

                        <p>
                            Seleccione o arrastre un archivo CSV para comenzar
                            la importación.
                        </p>

                        <input
                            ref={inputArchivoRef}
                            type="file"
                            accept=".csv,text/csv"
                            onChange={manejarSeleccionArchivo}
                            hidden
                        />

                        <button
                            type="button"
                            className="usuarios-boton-seleccionar"
                            onClick={abrirSelectorArchivo}
                        >
                            Seleccionar archivo
                        </button>

                        {archivo ? (
                            <div className="usuarios-archivo-seleccionado">
                                <span>Archivo seleccionado:</span>
                                <strong>{archivo.name}</strong>
                            </div>
                        ) : (
                            <span className="usuarios-ayuda-archivo">
                                Formato permitido: .csv
                            </span>
                        )}
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