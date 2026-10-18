import { useEffect, useMemo, useState } from "react";
import {
    FiBookOpen,
    FiChevronLeft,
    FiChevronRight,
    FiEye,
    FiPlus,
    FiRefreshCw,
    FiSearch
} from "react-icons/fi";
import RegistrarAsignatura from "./RegistrarAsignatura.jsx";
import DetalleAsignatura from "./DetalleAsignatura.jsx";

import { obtenerAsignaturas } from "../../services/asignaturaService";
import { useAuth } from "../../context/useAuth";
import { obtenerFacultades } from "../../services/catalogoService";

import "./Asignaturas.css";

const TAMANO_PAGINA = 10;

function Asignaturas() {

    const { usuario } = useAuth();

    const [asignaturas, setAsignaturas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    const [buscar, setBuscar] = useState("");
    const [facultad, setFacultad] = useState("TODAS");
    const [carrera, setCarrera] = useState("TODAS");
    const [estado, setEstado] = useState("TODOS");
    const [pagina, setPagina] = useState(1);

    const [facultades, setFacultades] = useState([]);
    const [errorCatalogo, setErrorCatalogo] = useState("");

    const [asignaturaDetalle, setAsignaturaDetalle] = useState(null);
    const [mostrarRegistro, setMostrarRegistro] = useState(false);
    const [mostrarExito, setMostrarExito] = useState(false);

    const esAdministrador =
        usuario?.nombreRol === "ADMINISTRADOR";

    const cargarAsignaturas = async () => {

        setCargando(true);
        setError("");

        try {

            const respuesta = await obtenerAsignaturas();

            setAsignaturas(
                Array.isArray(respuesta.data)
                    ? respuesta.data
                    : []
            );

        } catch (err) {

            console.error("Error cargando asignaturas:", err);

            setError(
                "No se pudieron cargar las asignaturas. Intenta nuevamente."
            );

        } finally {

            setCargando(false);

        }
    };

    useEffect(() => {
        let activo = true;

        const cargarDatos = async () => {
            try {
                const respuesta = await obtenerAsignaturas();

                if (activo) {
                    setAsignaturas(
                        Array.isArray(respuesta.data)
                            ? respuesta.data
                            : []
                    );
                    setError("");
                }
            } catch (error) {
                console.error("Error cargando asignaturas:", error);

                if (activo) {
                    setError(
                        "No se pudieron cargar las asignaturas. Intenta nuevamente."
                    );
                }
            } finally {
                if (activo) {
                    setCargando(false);
                }
            }
        };

        cargarDatos();

        return () => {
            activo = false;
        };
    }, []);

    useEffect(() => {
        let activo = true;

        const cargarFacultades = async () => {
            try {
                const respuesta = await obtenerFacultades();

                if (!activo) return;

                setFacultades(
                    Array.isArray(respuesta.data)
                        ? respuesta.data
                        : []
                );

                setErrorCatalogo("");

            } catch (err) {
                console.error("Error cargando facultades:", err);

                if (activo) {
                    setErrorCatalogo(
                        "No se pudieron cargar las facultades y carreras."
                    );
                }
            }
        };

        cargarFacultades();

        return () => {
            activo = false;
        };
    }, []);

    const carrerasDisponibles = useMemo(() => {
        const lista = facultades.flatMap((item) => {

            if (
                facultad !== "TODAS" &&
                String(item.idFacultad) !== facultad
            ) {
                return [];
            }

            return (item.carreras || []).map(
                carrera => carrera.nombre
            );
        });

        return [...new Set(lista)].sort(
            (a, b) => a.localeCompare(b, "es")
        );
    }, [facultades, facultad]);

    const asignaturasFiltradas = useMemo(() => {

        const texto = buscar.trim().toLocaleLowerCase("es");

        return asignaturas.filter(asignatura => {

            const coincideBusqueda =
                !texto ||
                (asignatura.codigoAsignatura || "")
                    .toLocaleLowerCase("es")
                    .includes(texto) ||
                (asignatura.nombreAsignatura || "")
                    .toLocaleLowerCase("es")
                    .includes(texto);

            const carrerasAsignatura = asignatura.carreras || [];

            const facultadActual = facultades.find(
                item => String(item.idFacultad) === facultad
            );

            const nombresCarrerasFacultad =
                facultadActual?.carreras?.map(
                    item => item.nombre
                ) || [];

            const coincideFacultad =
                facultad === "TODAS" ||
                carrerasAsignatura.some(
                    nombre => nombresCarrerasFacultad.includes(nombre)
                );

            const coincideCarrera =
                carrera === "TODAS" ||
                carrerasAsignatura.includes(carrera);

            const coincideEstado =
                estado === "TODOS" ||
                (estado === "ACTIVA" && asignatura.activo) ||
                (estado === "INACTIVA" && !asignatura.activo);

            return (
                coincideBusqueda &&
                coincideFacultad &&
                coincideCarrera &&
                coincideEstado
            );

        });

    }, [asignaturas, buscar, facultad, carrera, estado, facultades]);

    const totalPaginas = Math.max(
        1,
        Math.ceil(asignaturasFiltradas.length / TAMANO_PAGINA)
    );

    const paginaActual = Math.min(pagina, totalPaginas);

    const asignaturasPagina = asignaturasFiltradas.slice(
        (paginaActual - 1) * TAMANO_PAGINA,
        paginaActual * TAMANO_PAGINA
    );

    const actualizarBusqueda = (valor) => {
        setBuscar(valor);
        setPagina(1);
    };

    const actualizarFacultad = (valor) => {
        setFacultad(valor);
        setCarrera("TODAS");
        setPagina(1);
    };

    const actualizarCarrera = (valor) => {
        setCarrera(valor);
        setPagina(1);
    };

    const actualizarEstado = (valor) => {
        setEstado(valor);
        setPagina(1);
    };

    return (

        <div className="asignaturas-pagina">

            <header className="asignaturas-encabezado">

                <div>
                    <h1>Asignaturas</h1>
                    <p>
                        Registra y consulta las asignaturas
                        que se utilizarán en la organización
                        de los exámenes.
                    </p>
                </div>

                {esAdministrador && (
                    <button
                        type="button"
                        className="asignaturas-boton-principal"
                        onClick={() => setMostrarRegistro(true)}
                    >
                        <FiPlus />
                        Nueva asignatura
                    </button>
                )}

            </header>

            <section className="asignaturas-filtros">

                <div className="asignaturas-buscador">
                    <FiSearch />

                    <input
                        type="search"
                        placeholder="Buscar por código o nombre..."
                        aria-label="Buscar asignaturas"
                        value={buscar}
                        onChange={e =>
                            actualizarBusqueda(e.target.value)
                        }
                    />
                </div>

                <select
                    aria-label="Filtrar por facultad"
                    value={facultad}
                    onChange={e =>
                        actualizarFacultad(e.target.value)
                    }
                >
                    <option value="TODAS">
                        Todas las facultades
                    </option>

                    {facultades.map(item => (
                        <option
                            key={item.idFacultad}
                            value={String(item.idFacultad)}
                        >
                            {item.nombre}
                        </option>
                    ))}
                </select>

                <select
                    aria-label="Filtrar por carrera"
                    value={carrera}
                    onChange={e =>
                        actualizarCarrera(e.target.value)
                    }
                >
                    <option value="TODAS">
                        Todas las carreras
                    </option>

                    {carrerasDisponibles.map(nombreCarrera => (
                        <option
                            key={nombreCarrera}
                            value={nombreCarrera}
                        >
                            {nombreCarrera}
                        </option>
                    ))}
                </select>

                <select
                    aria-label="Filtrar por estado"
                    value={estado}
                    onChange={e =>
                        actualizarEstado(e.target.value)
                    }
                >
                    <option value="TODOS">
                        Todos los estados
                    </option>

                    <option value="ACTIVA">
                        Activas
                    </option>

                    <option value="INACTIVA">
                        Inactivas
                    </option>
                </select>

                <button
                    type="button"
                    className="asignaturas-boton-recargar"
                    onClick={cargarAsignaturas}
                    disabled={cargando}
                    title="Actualizar listado"
                    aria-label="Actualizar listado"
                >
                    <FiRefreshCw />
                </button>

            </section>

            {errorCatalogo && (
                <div className="asignaturas-error" role="alert">
                    {errorCatalogo}
                </div>
            )}
            
            {error && (
                <div className="asignaturas-error" role="alert">
                    {error}
                </div>
            )}

            <section className="asignaturas-panel">

                <div className="asignaturas-tabla-contenedor">

                    <table className="asignaturas-tabla">

                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Asignatura</th>
                                <th>Carrera(s)</th>
                                <th>Semestre</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>

                        <tbody>

                            {cargando ? (

                                <tr>
                                    <td
                                        colSpan={6}
                                        className="asignaturas-mensaje-tabla"
                                    >
                                        Cargando asignaturas...
                                    </td>
                                </tr>

                            ) : asignaturasPagina.length === 0 ? (

                                <tr>
                                    <td
                                        colSpan={6}
                                        className="asignaturas-mensaje-tabla"
                                    >
                                        <FiBookOpen size={26} />

                                        <span>
                                            {asignaturas.length === 0
                                                ? "No hay asignaturas registradas."
                                                : "No se encontraron coincidencias."
                                            }
                                        </span>
                                    </td>
                                </tr>

                            ) : (

                                asignaturasPagina.map(asignatura => (

                                    <tr key={asignatura.idAsignatura}>

                                        <td className="asignaturas-codigo">
                                            {asignatura.codigoAsignatura}
                                        </td>

                                        <td>
                                            {asignatura.nombreAsignatura}
                                        </td>

                                        <td>
                                            {(asignatura.carreras || [])
                                                .join(", ") || "—"}
                                        </td>

                                        <td>
                                            {asignatura.semestre}
                                        </td>

                                        <td>
                                            <span
                                                className={
                                                    asignatura.activo
                                                        ? "asignaturas-estado activa"
                                                        : "asignaturas-estado inactiva"
                                                }
                                            >
                                                {asignatura.activo
                                                    ? "Activa"
                                                    : "Inactiva"}
                                            </span>
                                        </td>

                                        <td>
                                            <button
                                                type="button"
                                                className="asignaturas-boton-ver"
                                                onClick={() =>
                                                    setAsignaturaDetalle(asignatura)
                                                }
                                            >
                                                <FiEye />
                                                Ver
                                            </button>
                                        </td>

                                    </tr>
                                ))

                            )}

                        </tbody>

                    </table>

                </div>

                <footer className="asignaturas-pie">

                    <span>
                        Mostrando {asignaturasFiltradas.length} de{" "}
                        {asignaturas.length} asignaturas
                    </span>

                    <div className="asignaturas-paginacion">

                        <button
                            type="button"
                            aria-label="Página anterior"
                            disabled={paginaActual <= 1}
                            onClick={() =>
                                setPagina(paginaActual - 1)
                            }
                        >
                            <FiChevronLeft />
                        </button>

                        <span>
                            {paginaActual} / {totalPaginas}
                        </span>

                        <button
                            type="button"
                            aria-label="Página siguiente"
                            disabled={paginaActual >= totalPaginas}
                            onClick={() =>
                                setPagina(paginaActual + 1)
                            }
                        >
                            <FiChevronRight />
                        </button>

                    </div>

                </footer>

            </section>

            {asignaturaDetalle && (
                <DetalleAsignatura
                    asignatura={asignaturaDetalle}
                    onCerrar={() => setAsignaturaDetalle(null)}
                />
            )}

            {mostrarRegistro && (
                <RegistrarAsignatura
                    onCerrar={() => setMostrarRegistro(false)}
                    onExito={() => {
                    setMostrarRegistro(false);
                    setMostrarExito(true);
                    cargarAsignaturas();
                    }}
                />
                )}

                {mostrarExito && (
                <div className="asignaturas-modal-fondo">
                    <div
                    className="asignaturas-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="asignatura-exito-titulo"
                    >
                    <div className="asignaturas-exito-contenido">
                        <FiBookOpen size={38} color="#16824a" />

                        <h2 id="asignatura-exito-titulo">
                        ¡Asignatura registrada!
                        </h2>

                        <p>
                        La asignatura se guardó correctamente.
                        </p>

                        <button
                        type="button"
                        className="asignaturas-boton-principal"
                        onClick={() => setMostrarExito(false)}
                        >
                        Aceptar
                        </button>
                    </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Asignaturas;