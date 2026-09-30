import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Usuarios.css";

function ImportarUsuarios() {
    const navigate = useNavigate();

    const inputArchivoRef = useRef(null);

    const [archivo, setArchivo] = useState(null);
    const [arrastrando, setArrastrando] = useState(false);
    const [errorArchivo, setErrorArchivo] = useState("");
    const [archivoValido, setArchivoValido] = useState(false);

    const abrirSelectorArchivo = () => {
        inputArchivoRef.current?.click();
    };

    const validarArchivoCSV = (archivoSeleccionado) => {
        const nombreArchivo = archivoSeleccionado.name.toLowerCase();

        if (!nombreArchivo.endsWith(".csv")) {
            setArchivo(null);
            setArchivoValido(false);
            setErrorArchivo(
                "El archivo seleccionado debe tener formato CSV."
            );
            return false;
        }

        return true;
    };

    const validarEstructuraCSV = (contenido) => {
        const lineas = contenido
            .split(/\r?\n/)
            .filter((linea) => linea.trim() !== "");

        if (lineas.length === 0) {
            return "El archivo CSV está vacío.";
        }

        const encabezados = lineas[0]
            .split(",")
            .map((encabezado) => encabezado.trim());

        if (encabezados.length < 2) {
            return "El archivo CSV no contiene una estructura válida.";
        }

        if (encabezados.some((encabezado) => encabezado === "")) {
            return "El archivo CSV contiene encabezados vacíos.";
        }

        const cantidadColumnas = encabezados.length;

        for (let indice = 1; indice < lineas.length; indice++) {
            const columnas = lineas[indice].split(",");

            if (columnas.length !== cantidadColumnas) {
                return `La fila ${indice + 1} no tiene la misma cantidad de columnas que el encabezado.`;
            }
        }

        return "";
    };

    const procesarArchivo = (archivoSeleccionado) => {
        setErrorArchivo("");
        setArchivoValido(false);

        if (!validarArchivoCSV(archivoSeleccionado)) {
            return;
        }

        const lector = new FileReader();

        lector.onload = (event) => {
            const contenido = event.target.result;
            const errorEstructura = validarEstructuraCSV(contenido);

            if (errorEstructura) {
                setArchivo(null);
                setArchivoValido(false);
                setErrorArchivo(errorEstructura);
                return;
            }

            setArchivo(archivoSeleccionado);
            setErrorArchivo("");
            setArchivoValido(true);
        };

        lector.onerror = () => {
            setArchivo(null);
            setArchivoValido(false);
            setErrorArchivo(
                "No se pudo leer el archivo seleccionado."
            );
        };

        lector.readAsText(archivoSeleccionado);
    };

    const manejarSeleccionArchivo = (event) => {
        const archivoSeleccionado = event.target.files[0];

        if (!archivoSeleccionado) {
            return;
        }

        procesarArchivo(archivoSeleccionado);

        event.target.value = "";
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

        procesarArchivo(archivoArrastrado);
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

                        {archivoValido && archivo && (
                            <div className="usuarios-archivo-valido">
                                Archivo CSV válido. La estructura fue verificada.
                            </div>
                        )}

                        {errorArchivo && (
                            <div className="usuarios-error-archivo">
                                <strong>Archivo no válido</strong>
                                <span>{errorArchivo}</span>
                            </div>
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