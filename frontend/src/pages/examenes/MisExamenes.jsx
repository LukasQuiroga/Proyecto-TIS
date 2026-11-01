
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiCalendar,
  FiClock,
  FiMapPin,
  FiRefreshCw,
  FiSearch,
  FiInfo,
} from "react-icons/fi";
import { obtenerMisExamenes } from "../../services/examenesEstudianteService";
import "./MisExamenes.css";

const presente = (valor) =>
  valor !== null &&
  valor !== undefined &&
  String(valor).trim() !== "";

const texto = (valor) =>
  presente(valor) ? valor : "Por confirmar";

const fechaTexto = (valor) => {
  if (!valor) return "Por confirmar";

  const partes = valor.split("-").map(Number);

  if (partes.length !== 3 || partes.some(Number.isNaN)) {
    return "Por confirmar";
  }

  const [anio, mes, dia] = partes;
  const fecha = new Date(anio, mes - 1, dia);

  if (Number.isNaN(fecha.getTime())) {
    return "Por confirmar";
  }

  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "long",
  }).format(fecha);
};

const horaTexto = (valor) =>
  valor ? valor.slice(0, 5) : "Por confirmar";

const incompleto = (examen) =>
  !examen.fechaExamen ||
  !examen.horaInicio ||
  !examen.aula?.trim() ||
  !examen.docente?.trim();

export default function MisExamenes() {
  const [examenes, setExamenes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("todos");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [seleccionado, setSeleccionado] = useState(null);
  const [aviso, setAviso] = useState("");

  const cargar = useCallback(async (signal) => {
    try {
      const datos = await obtenerMisExamenes({ signal });

      if (!signal?.aborted) {
        setExamenes(Array.isArray(datos) ? datos : []);
      }
    } catch (e) {
      if (!signal?.aborted) {
        setError(
          e?.response?.status === 403
            ? "No tienes autorización para consultar esta información."
            : "No se pudieron cargar tus exámenes. Comprueba tu conexión e inténtalo de nuevo."
        );
      }
    } finally {
      if (!signal?.aborted) {
        setCargando(false);
      }
    }
  }, []);

  
useEffect(() => {
  const controlador = new AbortController();

  obtenerMisExamenes({ signal: controlador.signal })
    .then((datos) => {
      if (!controlador.signal.aborted) {
        setExamenes(Array.isArray(datos) ? datos : []);
      }
    })
    .catch((error) => {
      if (!controlador.signal.aborted) {
        setError(
          error?.response?.status === 403
            ? "No tienes autorización para consultar esta información."
            : "No se pudieron cargar tus exámenes. Comprueba tu conexión e inténtalo de nuevo."
        );
      }
    })
    .finally(() => {
      if (!controlador.signal.aborted) {
        setCargando(false);
      }
    });

  return () => controlador.abort();
}, []);

  const actualizar = () => {
    setCargando(true);
    setError("");
    cargar();
  };

  const visibles = useMemo(
    () =>
      examenes.filter((examen) => {
        const filtro = busqueda.trim().toLocaleLowerCase("es");

        const coincide = [
          examen.nombreExamen,
          examen.asignatura,
          examen.codigo,
          examen.docente,
        ].some((campo) =>
          (campo || "").toLocaleLowerCase("es").includes(filtro)
        );

        if (!coincide) return false;

        if (estado === "pendientes") {
          return incompleto(examen);
        }

        if (estado === "programados") {
          return !incompleto(examen);
        }

        return true;
      }),
    [examenes, busqueda, estado]
  );

  const abrirDetalle = (examen) => {
    setSeleccionado(examen);

    if (incompleto(examen)) {
      setAviso("Algunos datos de este examen están por confirmar.");
    } else {
      setAviso("");
    }
  };

  const cerrarDetalle = () => {
    setSeleccionado(null);
    setAviso("");
  };

  return (
    <main className="mis-examenes">
      <header className="mis-examenes-cabecera">
        <div>
          <h1>Mis exámenes programados</h1>
          <p>
            Consulta las fechas, horarios, aulas y docentes de tus evaluaciones.
          </p>
        </div>

        <button
          className="mis-examenes-recargar"
          type="button"
          onClick={actualizar}
          disabled={cargando}
        >
          <FiRefreshCw /> Actualizar
        </button>
      </header>

      <section className="mis-examenes-panel">
        <div className="mis-examenes-panel-cabecera">
          <h2>Exámenes inscritos</h2>
          <span>{examenes.length} examen(es)</span>
        </div>

        <div className="mis-examenes-filtros">
          <label className="mis-examenes-buscar">
            <FiSearch />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por materia, examen o docente"
              aria-label="Buscar exámenes"
            />
          </label>

          <select
            aria-label="Filtrar exámenes"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="programados">Con datos completos</option>
            <option value="pendientes">Información pendiente</option>
          </select>
        </div>

        {cargando ? (
          <p className="mis-examenes-estado" role="status">
            Cargando exámenes...
          </p>
        ) : error ? (
          <div className="mis-examenes-estado" role="alert">
            <FiInfo />
            <p>{error}</p>
            <button type="button" onClick={actualizar}>
              Reintentar
            </button>
          </div>
        ) : !examenes.length ? (
          <div className="mis-examenes-estado">
            <FiCalendar size={35} />
            <h3>Sin exámenes inscritos</h3>
            <p>Todavía no tienes exámenes asociados a tu cuenta.</p>
          </div>
        ) : !visibles.length ? (
          <p className="mis-examenes-estado">
            No hay resultados para esta búsqueda.
          </p>
        ) : (
          <div className="mis-examenes-tabla-contenedor">
            <table className="mis-examenes-tabla">
              <thead>
                <tr>
                  <th>Asignatura y examen</th>
                  <th>Fecha</th>
                  <th>Horario</th>
                  <th>Aula</th>
                  <th>Docente</th>
                  <th>Acción</th>
                </tr>
              </thead>

              <tbody>
                {visibles.map((examen) => (
                  <tr key={examen.idExamen}>
                    <td>
                      <strong>{texto(examen.asignatura)}</strong>
                      <small>
                        {texto(examen.nombreExamen)} · Grupo{" "}
                        {texto(examen.grupo)}
                      </small>
                    </td>

                    <td>
                      <FiCalendar /> {fechaTexto(examen.fechaExamen)}
                    </td>

                    <td>
                      <FiClock /> {horaTexto(examen.horaInicio)}
                    </td>

                    <td>
                      <FiMapPin /> {texto(examen.aula)}
                    </td>

                    <td>{texto(examen.docente)}</td>

                    <td>
                      <button
                        type="button"
                        className="mis-examenes-ver"
                        onClick={() => abrirDetalle(examen)}
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {seleccionado && (
        <div
          className="mis-examenes-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              cerrarDetalle();
            }
          }}
        >
          <section
            className="mis-examenes-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-detalle-examen"
          >
            <div className="mis-examenes-modal-titulo">
              <h2 id="titulo-detalle-examen">
                Detalle del examen
              </h2>

              <button
                type="button"
                aria-label="Cerrar"
                onClick={cerrarDetalle}
              >
                ×
              </button>
            </div>

            <h3>{texto(seleccionado.nombreExamen)}</h3>

            <dl className="mis-examenes-detalles">
              <dt>Asignatura</dt>
              <dd>{texto(seleccionado.asignatura)}</dd>

              <dt>Grupo</dt>
              <dd>{texto(seleccionado.grupo)}</dd>

              <dt>Fecha</dt>
              <dd>{fechaTexto(seleccionado.fechaExamen)}</dd>

              <dt>Hora de inicio</dt>
              <dd>{horaTexto(seleccionado.horaInicio)}</dd>

              <dt>Hora de fin</dt>
              <dd>{horaTexto(seleccionado.horaFin)}</dd>

              <dt>Aula</dt>
              <dd>{texto(seleccionado.aula)}</dd>

              <dt>Docente</dt>
              <dd>{texto(seleccionado.docente)}</dd>

              <dt>Gestión</dt>
              <dd>{texto(seleccionado.gestion)}</dd>

              <dt>Descripción</dt>
              <dd>{texto(seleccionado.descripcion)}</dd>
            </dl>

            {aviso && (
              <div className="mis-examenes-aviso">
                <FiInfo />
                {aviso}
              </div>
            )}

            <footer>
              <button
                type="button"
                onClick={cerrarDetalle}
              >
                Cerrar
              </button>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}
