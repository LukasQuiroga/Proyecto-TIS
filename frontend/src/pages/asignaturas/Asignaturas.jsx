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

import { obtenerAsignaturas } from "../../services/asignaturaService";
import { useAuth } from "../../context/useAuth";

import "./Asignaturas.css";

const TAMANO_PAGINA = 10;

function Asignaturas() {

    const { usuario } = useAuth();

    const [asignaturas, setAsignaturas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    const [buscar, setBuscar] = useState("");
    const [carrera, setCarrera] = useState("TODAS");
    const [estado, setEstado] = useState("TODOS");
    const [pagina, setPagina] = useState(1);

    const [asignaturaDetalle, setAsignaturaDetalle] = useState(null);

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

    const carrerasDisponibles = useMemo(() => {

        const carreras = asignaturas.flatMap(
            asignatura => asignatura.carreras || []
        );

        return [...new Set(carreras)].sort(
            (a, b) => a.localeCompare(b, "es")
        );

    }, [asignaturas]);

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

            const coincideCarrera =
                carrera === "TODAS" ||
                (asignatura.carreras || []).includes(carrera);

            const coincideEstado =
                estado === "TODOS" ||
                (estado === "ACTIVA" && asignatura.activo) ||
                (estado === "INACTIVA" && !asignatura.activo);

            return (
                coincideBusqueda &&
                coincideCarrera &&
                coincideEstado
            );

        });

    }, [asignaturas, buscar, carrera, estado]);

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
                        disabled
                        title="El formulario se implementará en el siguiente commit"
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

                <div
                    className="asignaturas-modal-fondo"
                    onClick={() => setAsignaturaDetalle(null)}
                >

                    <div
                        className="asignaturas-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Detalle de asignatura"
                        onClick={e => e.stopPropagation()}
                    >

                        <h2>
                            {asignaturaDetalle.nombreAsignatura}
                        </h2>

                        <p>
                            <strong>Código:</strong>{" "}
                            {asignaturaDetalle.codigoAsignatura}
                        </p>

                        <p>
                            <strong>Semestre:</strong>{" "}
                            {asignaturaDetalle.semestre}
                        </p>

                        <p>
                            <strong>Estado:</strong>{" "}
                            {asignaturaDetalle.activo
                                ? "Activa"
                                : "Inactiva"}
                        </p>

                        <p>
                            <strong>Carreras:</strong>{" "}
                            {(asignaturaDetalle.carreras || [])
                                .join(", ") || "—"}
                        </p>

                        <p>
                            <strong>Descripción:</strong>{" "}
                            {asignaturaDetalle.descripcion || "Sin descripción"}
                        </p>

                        <button
                            type="button"
                            className="asignaturas-boton-principal"
                            onClick={() =>
                                setAsignaturaDetalle(null)
                            }
                        >
                            Cerrar
                        </button>

                    </div>

                </div>

            )}

        </div>
    );
}

export default Asignaturas;