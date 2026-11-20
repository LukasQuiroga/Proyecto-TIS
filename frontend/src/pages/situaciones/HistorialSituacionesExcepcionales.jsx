import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiDownload,
  FiEye,
  FiPlus,
  FiSearch,
  FiX,
} from "react-icons/fi";

import {
  obtenerCatalogoExamenes,
  obtenerEstudiantesExamen,
  obtenerHistorialSituaciones,
  obtenerDetalleSituacion,
  descargarEvidenciaSituacion,
  obtenerErrorSituacion,
} from "../../services/situacionExcepcionalService";

import "./HistorialSituacionesExcepcionales.css";

const FILTROS_INICIALES = {
  idExamen: "",
  idEstudiante: "",
  tipoSituacion: "",
};

function formatearFecha(fecha) {
  if (!fecha) return "—";

  const partes = fecha.split("-");

  if (partes.length !== 3) return fecha;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function formatearFechaRegistro(fecha) {
  if (!fecha) return "—";

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) return "—";

  return valor.toLocaleString("es-BO");
}

function formatearOcurrencia(fecha, hora) {
  return `${formatearFecha(fecha)} ${hora?.slice(0, 5) ?? ""}`;
}

function HistorialSituacionesExcepcionales() {
  const navigate = useNavigate();

  const [examenes, setExamenes] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [situaciones, setSituaciones] = useState([]);

  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [filtrosAplicados, setFiltrosAplicados] = useState({});

  const [cargando, setCargando] = useState(true);
  const [cargandoEstudiantes, setCargandoEstudiantes] = useState(false);

  const [error, setError] = useState("");
  const [errorCatalogos, setErrorCatalogos] = useState("");

  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState("");

  const [descargando, setDescargando] = useState(false);

  useEffect(() => {
    let activo = true;

    const cargarExamenes = async () => {
      try {
        const respuesta = await obtenerCatalogoExamenes();

        if (activo) {
          setExamenes(Array.isArray(respuesta.data) ? respuesta.data : []);
        }
      } catch (err) {
        if (activo) {
          setErrorCatalogos(
            obtenerErrorSituacion(
              err,
              "No se pudo cargar el catálogo de exámenes.",
            ),
          );
        }
      }
    };

    cargarExamenes();

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (!filtros.idExamen) {
      return undefined;
    }

    let activo = true;

    const cargarEstudiantes = async () => {
      setCargandoEstudiantes(true);

      try {
        const respuesta = await obtenerEstudiantesExamen(filtros.idExamen);

        if (activo) {
          setEstudiantes(Array.isArray(respuesta.data) ? respuesta.data : []);
          setErrorCatalogos("");
        }
      } catch (err) {
        if (activo) {
          setEstudiantes([]);
          setErrorCatalogos(
            obtenerErrorSituacion(
              err,
              "No se pudieron cargar los estudiantes del examen.",
            ),
          );
        }
      } finally {
        if (activo) {
          setCargandoEstudiantes(false);
        }
      }
    };

    cargarEstudiantes();

    return () => {
      activo = false;
    };
  }, [filtros.idExamen]);

  useEffect(() => {
    let activo = true;

    const cargarHistorial = async () => {
      setCargando(true);

      try {
        const respuesta = await obtenerHistorialSituaciones(filtrosAplicados);

        if (activo) {
          setSituaciones(Array.isArray(respuesta.data) ? respuesta.data : []);
          setError("");
        }
      } catch (err) {
        if (activo) {
          setSituaciones([]);
          setError(
            obtenerErrorSituacion(err, "No se pudo consultar el historial."),
          );
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    };

    cargarHistorial();

    return () => {
      activo = false;
    };
  }, [filtrosAplicados]);

  const actualizarFiltro = (campo, valor) => {
    setFiltros((anterior) => ({
      ...anterior,
      [campo]: valor,
      ...(campo === "idExamen" ? { idEstudiante: "" } : {}),
    }));

    if (campo === "idExamen") {
      setEstudiantes([]);
      setErrorCatalogos("");
    }
  };

  const aplicarFiltros = (evento) => {
    evento.preventDefault();

    setFiltrosAplicados({
      idExamen: filtros.idExamen ? Number(filtros.idExamen) : null,
      idEstudiante: filtros.idEstudiante ? Number(filtros.idEstudiante) : null,
      tipoSituacion: filtros.tipoSituacion.trim(),
    });
  };

  const limpiarFiltros = () => {
    setFiltros({ ...FILTROS_INICIALES });
    setEstudiantes([]);
    setErrorCatalogos("");
    setFiltrosAplicados({});
  };

  const abrirDetalle = async (idSituacion) => {
    setDetalleAbierto(true);
    setDetalle(null);
    setErrorDetalle("");
    setCargandoDetalle(true);

    try {
      const respuesta = await obtenerDetalleSituacion(idSituacion);
      setDetalle(respuesta.data);
    } catch (err) {
      setErrorDetalle(
        obtenerErrorSituacion(
          err,
          "No se pudo consultar el detalle de la situación.",
        ),
      );
    } finally {
      setCargandoDetalle(false);
    }
  };

  const cerrarDetalle = () => {
    if (descargando) return;

    setDetalleAbierto(false);
    setDetalle(null);
    setErrorDetalle("");
  };

  const descargarEvidencia = async () => {
    if (!detalle || descargando) return;

    setDescargando(true);
    setErrorDetalle("");

    try {
      const respuesta = await descargarEvidenciaSituacion(detalle.idSituacion);

      const tipo =
        respuesta.headers["content-type"] ||
        respuesta.data.type ||
        "application/octet-stream";

      const extension = tipo.includes("pdf")
        ? "pdf"
        : tipo.includes("png")
          ? "png"
          : tipo.includes("jpeg")
            ? "jpg"
            : "bin";

      const url = window.URL.createObjectURL(respuesta.data);

      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = `evidencia-${detalle.idSituacion}.${extension}`;

      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();

      window.setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      setErrorDetalle(
        obtenerErrorSituacion(err, "No se pudo descargar la evidencia."),
      );
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div className="situaciones-historial-pagina">
      <header className="situaciones-historial-encabezado">
        <div>
          <h1>Historial de situaciones excepcionales</h1>
          <p>Consulte las incidencias registradas durante los exámenes.</p>
        </div>

        <button
          type="button"
          className="situaciones-historial-boton-principal"
          onClick={() => navigate("/situaciones-excepcionales/registro")}
        >
          <FiPlus />
          Nueva situación
        </button>
      </header>

      <section className="situaciones-historial-panel">
        <h2>Filtros de búsqueda</h2>

        <form
          className="situaciones-historial-filtros"
          onSubmit={aplicarFiltros}
        >
          <div className="situaciones-historial-campo">
            <label htmlFor="historial-examen">Examen</label>

            <select
              id="historial-examen"
              value={filtros.idExamen}
              onChange={(e) => actualizarFiltro("idExamen", e.target.value)}
            >
              <option value="">Todos los exámenes</option>

              {examenes.map((examen) => (
                <option key={examen.idExamen} value={examen.idExamen}>
                  {examen.nombreExamen}
                </option>
              ))}
            </select>
          </div>

          <div className="situaciones-historial-campo">
            <label htmlFor="historial-estudiante">Estudiante</label>

            <select
              id="historial-estudiante"
              value={filtros.idEstudiante}
              disabled={!filtros.idExamen || cargandoEstudiantes}
              onChange={(e) => actualizarFiltro("idEstudiante", e.target.value)}
            >
              <option value="">
                {cargandoEstudiantes
                  ? "Cargando estudiantes..."
                  : "Todos los estudiantes"}
              </option>

              {estudiantes.map((estudiante) => (
                <option
                  key={estudiante.idEstudiante}
                  value={estudiante.idEstudiante}
                >
                  {estudiante.nombreEstudiante}
                </option>
              ))}
            </select>
          </div>

          <div className="situaciones-historial-campo">
            <label htmlFor="historial-tipo">Tipo de situación</label>

            <input
              id="historial-tipo"
              type="search"
              maxLength={100}
              value={filtros.tipoSituacion}
              onChange={(e) =>
                actualizarFiltro("tipoSituacion", e.target.value)
              }
              placeholder="Buscar por tipo..."
            />
          </div>

          <div className="situaciones-historial-acciones-filtros">
            <button
              type="button"
              className="situaciones-historial-boton-secundario"
              onClick={limpiarFiltros}
            >
              Limpiar
            </button>

            <button
              type="submit"
              className="situaciones-historial-boton-principal"
              disabled={cargando}
            >
              <FiSearch />
              Buscar
            </button>
          </div>
        </form>

        {errorCatalogos && (
          <p className="situaciones-historial-error" role="alert">
            {errorCatalogos}
          </p>
        )}
      </section>

      <section className="situaciones-historial-panel">
        <div className="situaciones-historial-titulo-tabla">
          <h2>Situaciones registradas</h2>
          <span>{situaciones.length} registros</span>
        </div>

        {error && (
          <p className="situaciones-historial-error" role="alert">
            {error}
          </p>
        )}

        <div className="situaciones-historial-tabla-contenedor">
          <table className="situaciones-historial-tabla">
            <thead>
              <tr>
                <th>ID</th>
                <th>Examen</th>
                <th>Estudiante</th>
                <th>Tipo</th>
                <th>Ocurrencia</th>
                <th>Fecha de registro</th>
                <th>Evidencia</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={8}>Cargando historial...</td>
                </tr>
              ) : situaciones.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    {error
                      ? "No se pudo cargar el historial."
                      : "No se encontraron situaciones excepcionales."}
                  </td>
                </tr>
              ) : (
                situaciones.map((situacion) => (
                  <tr key={situacion.idSituacion}>
                    <td>{situacion.idSituacion}</td>
                    <td>{situacion.nombreExamen}</td>
                    <td>
                      {situacion.nombreEstudiante ||
                        "Sin estudiante específico"}
                    </td>
                    <td>{situacion.tipoSituacion}</td>
                    <td>
                      {formatearOcurrencia(
                        situacion.fechaOcurrencia,
                        situacion.horaOcurrencia,
                      )}
                    </td>
                    <td>{formatearFechaRegistro(situacion.fechaRegistro)}</td>
                    <td>{situacion.tieneEvidencia ? "Sí" : "No"}</td>
                    <td>
                      <button
                        type="button"
                        className="situaciones-historial-boton-detalle"
                        onClick={() => abrirDetalle(situacion.idSituacion)}
                      >
                        <FiEye />
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <button
        type="button"
        className="situaciones-historial-volver"
        onClick={() => navigate("/")}
      >
        <FiArrowLeft />
        Volver al inicio
      </button>

      {detalleAbierto && (
        <div className="situaciones-historial-fondo-modal">
          <section
            className="situaciones-historial-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="situaciones-detalle-titulo"
          >
            <div className="situaciones-historial-modal-encabezado">
              <h2 id="situaciones-detalle-titulo">Detalle de la situación</h2>

              <button
                type="button"
                aria-label="Cerrar detalle"
                onClick={cerrarDetalle}
                disabled={descargando}
              >
                <FiX />
              </button>
            </div>

            {cargandoDetalle && <p>Cargando información...</p>}

            {errorDetalle && (
              <p className="situaciones-historial-error" role="alert">
                {errorDetalle}
              </p>
            )}

            {detalle && (
              <div className="situaciones-historial-detalle">
                <div>
                  <strong>Número de registro</strong>
                  <p>{detalle.idSituacion}</p>
                </div>

                <div>
                  <strong>Examen</strong>
                  <p>{detalle.nombreExamen}</p>
                </div>

                <div>
                  <strong>Estudiante</strong>
                  <p>
                    {detalle.nombreEstudiante || "Sin estudiante específico"}
                  </p>
                </div>

                <div>
                  <strong>Tipo de situación</strong>
                  <p>{detalle.tipoSituacion}</p>
                </div>

                <div>
                  <strong>Fecha y hora de ocurrencia</strong>
                  <p>
                    {formatearOcurrencia(
                      detalle.fechaOcurrencia,
                      detalle.horaOcurrencia,
                    )}
                  </p>
                </div>

                <div>
                  <strong>Fecha de registro</strong>
                  <p>{formatearFechaRegistro(detalle.fechaRegistro)}</p>
                </div>

                <div>
                  <strong>Registrado por</strong>
                  <p>{detalle.registradoPor || "—"}</p>
                </div>

                <div className="situaciones-historial-detalle-ancho">
                  <strong>Descripción completa</strong>
                  <p>{detalle.descripcion}</p>
                </div>

                <div className="situaciones-historial-detalle-ancho">
                  <strong>Evidencia</strong>

                  {detalle.tieneEvidencia ? (
                    <button
                      type="button"
                      className="situaciones-historial-boton-principal"
                      onClick={descargarEvidencia}
                      disabled={descargando}
                    >
                      <FiDownload />
                      {descargando ? "Descargando..." : "Descargar evidencia"}
                    </button>
                  ) : (
                    <p>No se adjuntó evidencia.</p>
                  )}
                </div>
              </div>
            )}

            <div className="situaciones-historial-modal-pie">
              <button
                type="button"
                className="situaciones-historial-boton-secundario"
                onClick={cerrarDetalle}
                disabled={descargando}
              >
                Cerrar
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default HistorialSituacionesExcepcionales;
