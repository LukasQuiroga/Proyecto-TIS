
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiRefreshCw,
  FiUsers,
} from "react-icons/fi";

import {
  listarEstudiantesPendientes,
  obtenerExamenesIngreso,
} from "../../services/validacionHabilitacionService";

import { obtenerResumenIngresos } from "../../services/resumenIngresosService";

import "./EstudiantesPendientes.css";

function obtenerMensajeError(error) {
  const estado = error?.response?.status;

  if (estado === 401) {
    return "Tu sesión expiró. Inicia sesión nuevamente.";
  }

  if (estado === 403) {
    return "No tienes permisos para consultar esta información.";
  }

  if (estado === 404) {
    return "La información solicitada no está disponible.";
  }

  if (estado >= 500) {
    return "El servidor no pudo completar la consulta.";
  }

  return "No se pudo cargar la información. Intenta nuevamente.";
}

function EstudiantesPendientes() {
  const [examenes, setExamenes] = useState([]);
  const [idExamen, setIdExamen] = useState("");

  const [estudiantes, setEstudiantes] = useState([]);
  const [resumen, setResumen] = useState(null);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [errorExamenes, setErrorExamenes] = useState("");

  const solicitudActual = useRef(0);

  useEffect(() => {
    let activo = true;

    obtenerExamenesIngreso()
      .then((datos) => {
        if (!activo) return;

        if (!Array.isArray(datos)) {
          throw new Error("Lista de exámenes inválida");
        }

        setExamenes(datos);
      })
      .catch(() => {
        if (activo) {
          setErrorExamenes(
            "No se pudieron cargar los exámenes disponibles."
          );
        }
      });

    return () => {
      activo = false;
    };
  }, []);

  const cargarDatos = useCallback(async (examen = "") => {
    const solicitud = ++solicitudActual.current;

    setCargando(true);
    setError("");

    try {
      const [datosEstudiantes, datosResumen] =
        await Promise.all([
          listarEstudiantesPendientes(examen),
          obtenerResumenIngresos(examen),
        ]);

      if (solicitud !== solicitudActual.current) {
        return;
      }

      if (!Array.isArray(datosEstudiantes)) {
        throw new Error("Listado de estudiantes inválido");
      }

      const indicadores = [
        "ingresados",
        "pendientes",
        "rechazados",
      ];

      if (
        !datosResumen ||
        !indicadores.every(
          (clave) =>
            Number.isSafeInteger(datosResumen[clave]) &&
            datosResumen[clave] >= 0
        )
      ) {
        throw new Error("Indicadores inválidos");
      }

      setEstudiantes(datosEstudiantes);
      setResumen(datosResumen);
    } catch (err) {
      if (solicitud !== solicitudActual.current) {
        return;
      }

      setEstudiantes([]);
      setResumen(null);
      setError(obtenerMensajeError(err));
    } finally {
      if (solicitud === solicitudActual.current) {
        setCargando(false);
      }
    }
  }, []);

  useEffect(() => {
    let activo = true;

    Promise.resolve().then(() => {
      if (activo) {
        cargarDatos(idExamen);
      }
    });

    return () => {
      activo = false;
      solicitudActual.current += 1;
    };
  }, [idExamen, cargarDatos]);

  const actualizar = () => {
    if (!cargando) {
      cargarDatos(idExamen);
    }
  };

  return (
    <main className="pendientes-pagina">
      <header className="pendientes-encabezado">
        <div>
          <h1>Estudiantes pendientes</h1>
          <p>
            Consulte los estudiantes que todavía no
            registraron su ingreso al examen.
          </p>
        </div>

        <button
          type="button"
          className="pendientes-actualizar"
          onClick={actualizar}
          disabled={cargando}
        >
          <FiRefreshCw />
          Actualizar
        </button>
      </header>

      <section
        className="pendientes-resumen"
        aria-label="Resumen de ingresos"
      >
        <h2>Resumen de ingresos</h2>

        <div className="pendientes-tarjetas">
          <article className="pendientes-tarjeta">
            <FiCheckCircle
              className="pendientes-icono ingresados"
            />

            <div>
              <span>Ingresados</span>
              <strong>
                {cargando ? "..." : resumen?.ingresados ?? "-"}
              </strong>
            </div>
          </article>

          <article className="pendientes-tarjeta">
            <FiClock
              className="pendientes-icono pendientes"
            />

            <div>
              <span>Pendientes</span>
              <strong>
                {cargando ? "..." : resumen?.pendientes ?? "-"}
              </strong>
            </div>
          </article>

          <article className="pendientes-tarjeta">
            <FiAlertTriangle
              className="pendientes-icono rechazados"
            />

            <div>
              <span>Rechazados</span>
              <strong>
                {cargando ? "..." : resumen?.rechazados ?? "-"}
              </strong>
            </div>
          </article>
        </div>
      </section>

      <section className="pendientes-contenedor">
        <div className="pendientes-filtros">
          <div className="pendientes-selector">
            <label htmlFor="pendientes-examen">
              Examen
            </label>

            <select
              id="pendientes-examen"
              value={idExamen}
              onChange={(event) =>
                setIdExamen(event.target.value)
              }
            >
              <option value="">Todos los exámenes</option>

              {examenes.map((examen) => (
                <option
                  key={examen.idExamen}
                  value={examen.idExamen}
                >
                  {examen.codigo && examen.nombreExamen
                    ? `${examen.codigo} - ${examen.nombreExamen}`
                    : examen.nombreExamen ||
                      examen.codigo ||
                      `Examen ${examen.idExamen}`}
                </option>
              ))}
            </select>
          </div>

          {errorExamenes && (
            <p className="pendientes-error">
              {errorExamenes}
            </p>
          )}
        </div>

        {error && (
          <div className="pendientes-error" role="alert">
            {error}
            <button type="button" onClick={actualizar}>
              Reintentar
            </button>
          </div>
        )}

        {!error && (
          <>
            <div className="pendientes-tabla-titulo">
              <h2>Listado de estudiantes pendientes</h2>

              {!cargando && (
                <span>
                  {estudiantes.length} registros
                </span>
              )}
            </div>

            {cargando ? (
              <p className="pendientes-cargando" role="status">
                Cargando estudiantes pendientes...
              </p>
            ) : estudiantes.length === 0 ? (
              <div className="pendientes-vacio">
                <FiUsers size={32} />
                <p>No hay estudiantes pendientes de ingreso.</p>
              </div>
            ) : (
              <div className="pendientes-tabla-contenedor">
                <table className="pendientes-tabla">
                  <thead>
                    <tr>
                      <th>Código universitario</th>
                      <th>Estudiante</th>
                      <th>Examen</th>
                      <th>Carrera</th>
                      <th>Estado</th>
                    </tr>
                  </thead>

                  <tbody>
                    {estudiantes.map((estudiante) => (
                      <tr
                        key={`${estudiante.idExamen}-${estudiante.idEstudiante}`}
                      >
                        <td>
                          {estudiante.codigoUniversitario || "-"}
                        </td>

                        <td>
                          {estudiante.nombreCompleto || "-"}
                        </td>

                        <td>
                          {estudiante.nombreExamen || "-"}
                        </td>

                        <td>
                          {estudiante.carrera || "-"}
                        </td>

                        <td>
                          <span className="pendientes-estado">
                            Pendiente
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default EstudiantesPendientes;
