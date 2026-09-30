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
    const [erroresRegistros, setErroresRegistros] = useState([]);

    const abrirSelectorArchivo = () => {
        inputArchivoRef.current?.click();
    };

    const validarArchivoCSV = (archivoSeleccionado) => {
        const nombreArchivo = archivoSeleccionado.name.toLowerCase();

        if (!nombreArchivo.endsWith(".csv")) {
            setArchivo(null);
            setArchivoValido(false);
            setErroresRegistros([]);
            setErrorArchivo(
                "El archivo seleccionado debe tener formato CSV."
            );
            return false;
        }

        return true;
    };

    const obtenerLineasCSV = (contenido) => {
        return contenido
            .replace(/^\uFEFF/, "")
            .split(/\r?\n/)
            .filter((linea) => linea.trim() !== "");
    };

    const validarEstructuraCSV = (lineas) => {
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

    const validarRegistrosCSV = (lineas) => {
        if (lineas.length <= 1) {
            return ["El archivo CSV no contiene registros de usuarios."];
        }

        const encabezados = lineas[0]
            .split(",")
            .map((encabezado) => encabezado.trim());

        const columnasRequeridas = [
            "nombres",
            "apellidos",
            "documentoIdentidad",
            "correo",
            "telefono",
            "rol",
            "codigoUniversitario",
            "carrera",
        ];

        const columnasFaltantes = columnasRequeridas.filter(
            (columna) => !encabezados.includes(columna)
        );

        if (columnasFaltantes.length > 0) {
            return [
                `Faltan columnas necesarias para validar los registros: ${columnasFaltantes.join(
                    ", "
                )}.`,
            ];
        }

        const indiceNombres = encabezados.indexOf("nombres");
        const indiceApellidos = encabezados.indexOf("apellidos");
        const indiceDocumento =
            encabezados.indexOf("documentoIdentidad");
        const indiceCorreo = encabezados.indexOf("correo");
        const indiceTelefono = encabezados.indexOf("telefono");
        const indiceRol = encabezados.indexOf("rol");
        const indiceCodigoUniversitario =
            encabezados.indexOf("codigoUniversitario");
        const indiceCarrera = encabezados.indexOf("carrera");

        const regexNombre =
            /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]+$/;

        const regexDocumento =
            /^[A-Za-z0-9.-]+$/;

        const regexCorreo =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        const regexTelefono =
            /^[0-9+\-\s()]+$/;

        const rolesPermitidos = [
            "Administrador",
            "Docente",
            "Personal de ingreso",
            "Estudiante",
        ];

        const errores = [];
        const documentosEncontrados = new Set();
        const correosEncontrados = new Set();

        for (let indice = 1; indice < lineas.length; indice++) {
            const columnas = lineas[indice]
                .split(",")
                .map((valor) => valor.trim());

            const numeroFila = indice + 1;

            const nombres = columnas[indiceNombres];
            const apellidos = columnas[indiceApellidos];
            const documento = columnas[indiceDocumento];
            const correo = columnas[indiceCorreo];
            const telefono = columnas[indiceTelefono];
            const rol = columnas[indiceRol];
            const codigoUniversitario =
                columnas[indiceCodigoUniversitario];
            const carrera = columnas[indiceCarrera];

            if (!nombres) {
                errores.push(
                    `Fila ${numeroFila}: el nombre es obligatorio.`
                );
            } else if (!regexNombre.test(nombres)) {
                errores.push(
                    `Fila ${numeroFila}: el nombre tiene un formato inválido.`
                );
            }

            if (!apellidos) {
                errores.push(
                    `Fila ${numeroFila}: el apellido es obligatorio.`
                );
            } else if (!regexNombre.test(apellidos)) {
                errores.push(
                    `Fila ${numeroFila}: el apellido tiene un formato inválido.`
                );
            }

            if (!documento) {
                errores.push(
                    `Fila ${numeroFila}: el documento de identidad es obligatorio.`
                );
            } else if (!regexDocumento.test(documento)) {
                errores.push(
                    `Fila ${numeroFila}: el documento de identidad tiene un formato inválido.`
                );
            }

            if (!correo) {
                errores.push(
                    `Fila ${numeroFila}: el correo electrónico es obligatorio.`
                );
            } else if (!regexCorreo.test(correo)) {
                errores.push(
                    `Fila ${numeroFila}: el correo electrónico tiene un formato inválido.`
                );
            }

            if (documento) {
                const documentoNormalizado = documento.toLowerCase();

                if (documentosEncontrados.has(documentoNormalizado)) {
                    errores.push(
                        `Fila ${numeroFila}: el documento de identidad "${documento}" está duplicado en el archivo.`
                    );
                } else {
                    documentosEncontrados.add(documentoNormalizado);
                }
            }

            if (correo) {
                const correoNormalizado = correo.toLowerCase();

                if (correosEncontrados.has(correoNormalizado)) {
                    errores.push(
                        `Fila ${numeroFila}: el correo electrónico "${correo}" está duplicado en el archivo.`
                    );
                } else {
                    correosEncontrados.add(correoNormalizado);
                }
            }

            if (telefono && !regexTelefono.test(telefono)) {
                errores.push(
                    `Fila ${numeroFila}: el teléfono tiene un formato inválido.`
                );
            }

            if (!rol) {
                errores.push(
                    `Fila ${numeroFila}: el rol es obligatorio.`
                );
            } else if (!rolesPermitidos.includes(rol)) {
                errores.push(
                    `Fila ${numeroFila}: el rol "${rol}" no es válido.`
                );
            }

            if (rol === "Estudiante") {
                if (!codigoUniversitario) {
                    errores.push(
                        `Fila ${numeroFila}: el código universitario es obligatorio para estudiantes.`
                    );
                }

                if (!carrera) {
                    errores.push(
                        `Fila ${numeroFila}: la carrera es obligatoria para estudiantes.`
                    );
                }
            }
        }

        return errores;
    };

    const procesarArchivo = (archivoSeleccionado) => {
        setErrorArchivo("");
        setArchivoValido(false);
        setErroresRegistros([]);

        if (!validarArchivoCSV(archivoSeleccionado)) {
            return;
        }

        const lector = new FileReader();

        lector.onload = (event) => {
            const contenido = event.target.result;

            const lineas = obtenerLineasCSV(contenido);

            const errorEstructura =
                validarEstructuraCSV(lineas);

            if (errorEstructura) {
                setArchivo(null);
                setArchivoValido(false);
                setErroresRegistros([]);
                setErrorArchivo(errorEstructura);
                return;
            }

            const erroresEncontrados =
                validarRegistrosCSV(lineas);

            setArchivo(archivoSeleccionado);

            if (erroresEncontrados.length > 0) {
                setArchivoValido(false);
                setErroresRegistros(erroresEncontrados);
                setErrorArchivo("");
                return;
            }

            setErroresRegistros([]);
            setErrorArchivo("");
            setArchivoValido(true);
        };

        lector.onerror = () => {
            setArchivo(null);
            setArchivoValido(false);
            setErroresRegistros([]);
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

        const archivoArrastrado =
            event.dataTransfer.files[0];

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
                                <span>
                                    Archivo seleccionado:
                                </span>
                                <strong>
                                    {archivo.name}
                                </strong>
                            </div>
                        ) : (
                            <span className="usuarios-ayuda-archivo">
                                Formato permitido: .csv
                            </span>
                        )}

                        {archivoValido && archivo && (
                            <div className="usuarios-archivo-valido">
                                Archivo CSV válido. Los registros fueron
                                verificados.
                            </div>
                        )}

                        {errorArchivo && (
                            <div className="usuarios-error-archivo">
                                <strong>
                                    Archivo no válido
                                </strong>
                                <span>{errorArchivo}</span>
                            </div>
                        )}

                        {erroresRegistros.length > 0 && (
                            <div className="usuarios-error-archivo">
                                <strong>
                                    Se encontraron errores en los registros
                                </strong>

                                {erroresRegistros.map(
                                    (error, indice) => (
                                        <span key={indice}>
                                            {error}
                                        </span>
                                    )
                                )}
                            </div>
                        )}
                    </div>

                    <div className="usuarios-formulario-acciones">
                        <button
                            type="button"
                            className="usuarios-boton-cancelar"
                            onClick={() =>
                                navigate("/usuarios/registrar")
                            }
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