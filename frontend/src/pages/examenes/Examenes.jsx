import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiChevronLeft,
  FiChevronRight,
  FiClipboard,
  FiEdit2,
  FiEye,
  FiPlus,
  FiSearch,
} from "react-icons/fi";

import {
  obtenerExamenes,
  obtenerMensajeErrorExamen,
} from "../../services/examenService";
import DetalleExamen from "./DetalleExamen.jsx";
import {
  formatearTipoEvaluacion,
  obtenerEstadoExamen,
  obtenerEstadoRecurso,
  obtenerNombreAsignatura,
} from "./utilsExamen.js";

import "./Examenes.css";

const TAMANO_PAGINA = 10;

const ESTADOS_FILTRO = [
  { valor: "", etiqueta: "Todos los estados" },
  { valor: "ACTIVO", etiqueta: "Activo" },
  { valor: "PROGRAMADO", etiqueta: "Programado" },
  { valor: "EN_PREPARACION", etiqueta: "En preparación" },
  { valor: "INACTIVO", etiqueta: "Inactivo" },
];

function Examenes() {
  const navigate = useNavigate();

  const [examenes, setExamenes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [buscar, setBuscar] = useState("");
  const [estado, setEstado] = useState("");
  const [pagina, setPagina] = useState(1);

  const [examenDetalle, setExamenDetalle] = useState(null);

  const extraerLista = (datos) => {
    if (Array.isArray(datos)) {
      return datos;
    }

    if (Array.isArray(datos?.content)) {
      return datos.content;
    }

    return [];
  };

  useEffect(() => {
    let activo = true;

    const cargar = async () => {
      try {
        const respuesta = await obtenerExamenes();
        const lista = extraerLista(respuesta.data);

        if (activo) {
          setExamenes(lista);
          setError("");
        }
      } catch (err) {
        console.error("Error cargando exámenes:", err);

        if (activo) {
          setExamenes([]);
          setError(obtenerMensajeErrorExamen(err));
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    };

    cargar();

    return () => {
      activo = false;
    };
  }, []);

  const examenesFiltrados = useMemo(() => {
    const termino = buscar.trim().toLocaleLowerCase("es");

    return examenes.filter((examen) => {
      const nombre = String(examen.nombreExamen ?? "").toLocaleLowerCase("es");

      const asignatura = String(
        obtenerNombreAsignatura(examen),
      ).toLocaleLowerCase("es");

      const coincideBusqueda =
        !termino ||
        nombre.includes(termino) ||
        asignatura.includes(termino);

      const coincideEstado =
        !estado || obtenerEstadoExamen(examen.estado).clave === estado;

      return coincideBusqueda && coincideEstado;
    });
  }, [examenes, buscar, estado]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(examenesFiltrados.length / TAMANO_PAGINA),
  );

  const paginaActual = Math.min(pagina, totalPaginas);

  const examenesPagina = examenesFiltrados.slice(
    (paginaActual - 1) * TAMANO_PAGINA,
    paginaActual * TAMANO_PAGINA,
  );

  const actualizarBusqueda = (valor) => {
    setBuscar(valor);
    setPagina(1);
  };

  const actualizarEstado = (valor) => {
    setEstado(valor);
    setPagina(1);
  };

  return (
    <div className="examenes-pagina">
      <header className="examenes-encabezado">
        <div>
          <h1>Exámenes</h1>

          <p>Consulta y administra los exámenes registrados en el sistema.</p>
        </div>

        <button
          type="button"
          className="examenes-boton-principal"
          onClick={() => navigate("/examenes/registro")}
        >
          <FiPlus />
          Nuevo examen
        </button>
      </header>

      <section className="examenes-filtros">
        <div className="examenes-buscador">
          <FiSearch />

          <input
            type="search"
            placeholder="Buscar examen por nombre o asignatura..."
            aria-label="Buscar exámenes"
            value={buscar}
            onChange={(e) => actualizarBusqueda(e.target.value)}
          />
        </div>

        <select
          aria-label="Filtrar por estado"
          value={estado}
          onChange={(e) => actualizarEstado(e.target.value)}
        >
          {ESTADOS_FILTRO.map((opcion) => (
            <option key={opcion.valor} value={opcion.valor}>
              {opcion.etiqueta}
            </option>
          ))}
        </select>
      </section>

      {error && (
        <div className="examenes-error" role="alert">
          {error}
        </div>
      )}

      <section className="examenes-panel">
        <div className="examenes-tabla-contenedor">
          <table className="examenes-tabla">
            <thead>
              <tr>
                <th>ID</th>
                <th>Código</th>
                <th>Nombre</th>
                <th>Asignatura</th>
                <th>Tipo</th>
                <th>Gestión</th>
                <th>Estado</th>
                <th>Habilitaciones</th>
                <th>Ambientes</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={10} className="examenes-mensaje-tabla">
                    Cargando exámenes...
                  </td>
                </tr>
              ) : examenesPagina.length === 0 ? (
                <tr>
                  <td colSpan={10} className="examenes-mensaje-tabla">
                    <FiClipboard size={26} />

                    <span>
                      {examenes.length === 0
                        ? "No hay exámenes registrados."
                        : "No se encontraron exámenes con los filtros aplicados."}
                    </span>
                  </td>
                </tr>
              ) : (
                examenesPagina.map((examen) => {
                  const estadoVisual = obtenerEstadoExamen(examen.estado);

                  const habilitaciones = obtenerEstadoRecurso(
                    examen.habilitaciones ?? examen.estadoHabilitaciones,
                  );

                  const ambientes = obtenerEstadoRecurso(
                    examen.ambientes ?? examen.estadoAmbientes,
                  );

                  return (
                    <tr key={examen.idExamen ?? examen.id}>
                      <td className="examenes-id">
                        {examen.idExamen ?? examen.id}
                      </td>

                      <td className="examenes-codigo">
                        {examen.codigo || "—"}
                      </td>

                      <td>{examen.nombreExamen || "—"}</td>

                      <td>{obtenerNombreAsignatura(examen)}</td>

                      <td>{formatearTipoEvaluacion(examen.tipoEvaluacion)}</td>

                      <td>{examen.gestion || "—"}</td>

                      <td>
                        <span
                          className={`examenes-estado ${estadoVisual.clase}`}
                        >
                          {estadoVisual.etiqueta}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`examenes-recurso ${habilitaciones.clase}`}
                        >
                          {habilitaciones.etiqueta}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`examenes-recurso ${ambientes.clase}`}
                        >
                          {ambientes.etiqueta}
                        </span>
                      </td>

                      <td>
                        <div className="examenes-acciones">
                          <button
                            type="button"
                            className="examenes-boton-accion"
                            title="Ver detalle"
                            aria-label="Ver detalle del examen"
                            onClick={() => setExamenDetalle(examen)}
                          >
                            <FiEye />
                          </button>

                          <button
                            type="button"
                            className="examenes-boton-accion"
                            title="Editar examen"
                            aria-label="Editar examen"
                            onClick={() =>
                              navigate(
                                `/examenes/${examen.idExamen ?? examen.id}/editar`,
                              )
                            }
                          >
                            <FiEdit2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <footer className="examenes-pie">
          <span>
            Mostrando {examenesPagina.length} de {examenesFiltrados.length}{" "}
            exámenes
          </span>

          <div className="examenes-paginacion">
            <button
              type="button"
              aria-label="Página anterior"
              disabled={paginaActual <= 1}
              onClick={() => setPagina(paginaActual - 1)}
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
              onClick={() => setPagina(paginaActual + 1)}
            >
              <FiChevronRight />
            </button>
          </div>
        </footer>
      </section>

      {examenDetalle && (
        <DetalleExamen
          examen={examenDetalle}
          onCerrar={() => setExamenDetalle(null)}
        />
      )}
    </div>
  );
}

export default Examenes;
