import { useEffect, useMemo, useState } from "react";
import {
  obtenerExamenes,
  obtenerMensajeErrorExamen,
} from "../../services/examenService";
import {
  listarEstudiantesExamen,
  listarHistorialExpulsiones,
  registrarExpulsion,
  obtenerMensajeErrorExpulsion,
} from "../../services/expulsionService";
import { obtenerNombreAsignatura } from "../examenes/utilsExamen";
import "./Expulsiones.css";

function normalizarTexto(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function fechaActual() {
  const ahora = new Date();

  return [
    ahora.getFullYear(),
    String(ahora.getMonth() + 1).padStart(2, "0"),
    String(ahora.getDate()).padStart(2, "0"),
  ].join("-");
}

function horaActual() {
  const ahora = new Date();

  return [
    String(ahora.getHours()).padStart(2, "0"),
    String(ahora.getMinutes()).padStart(2, "0"),
  ].join(":");
}

function formatearFechaHora(valor) {
  if (!valor) {
    return "—";
  }

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return "—";
  }

  return fecha.toLocaleString("es-BO", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function Expulsiones() {
  const [examenes, setExamenes] = useState([]);
  const [cargandoExamenes, setCargandoExamenes] = useState(true);
  const [errorExamenes, setErrorExamenes] = useState("");
  const [busquedaExamen, setBusquedaExamen] = useState("");
  const [fechaFiltro, setFechaFiltro] = useState("");

  const [examenSeleccionado, setExamenSeleccionado] = useState(null);
  const [estudiantes, setEstudiantes] = useState([]);
  const [cargandoEstudiantes, setCargandoEstudiantes] = useState(false);
  const [errorEstudiantes, setErrorEstudiantes] = useState("");
  const [busquedaEstudiante, setBusquedaEstudiante] = useState("");
  const [recargaEstudiantes, setRecargaEstudiantes] = useState(0);
  const [historial, setHistorial] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState("");

  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);
  const [fechaExpulsion, setFechaExpulsion] = useState("");
  const [horaExpulsion, setHoraExpulsion] = useState("");
  const [motivo, setMotivo] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errorRegistro, setErrorRegistro] = useState("");
  const [registroExitoso, setRegistroExitoso] = useState(null);

  const idExamen =
    examenSeleccionado?.idExamen ?? examenSeleccionado?.id ?? null;

  useEffect(() => {
    let activo = true;

    async function cargarExamenes() {
      try {
        const respuesta = await obtenerExamenes();
        const datos = respuesta.data;
        const lista = Array.isArray(datos) ? datos : datos?.content;

        if (!Array.isArray(lista)) {
          throw new Error("Listado de exámenes inválido");
        }

        if (activo) {
          setExamenes(lista);
          setErrorExamenes("");
        }
      } catch (error) {
        if (activo) {
          setErrorExamenes(obtenerMensajeErrorExamen(error));
        }
      } finally {
        if (activo) {
          setCargandoExamenes(false);
        }
      }
    }

    cargarExamenes();

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (idExamen == null) {
      return;
    }

    let activo = true;

    async function cargarEstudiantes() {
      setCargandoEstudiantes(true);
      setErrorEstudiantes("");

      try {
        const datos = await listarEstudiantesExamen(idExamen);

        if (!Array.isArray(datos)) {
          throw new Error("Listado de estudiantes inválido");
        }

        if (activo) {
          setEstudiantes(datos);
        }
      } catch (error) {
        if (activo) {
          setEstudiantes([]);
          setErrorEstudiantes(
            error?.response?.status === 403
              ? "No tienes autorización para consultar estos estudiantes."
              : "No se pudieron cargar los estudiantes del examen.",
          );
        }
      } finally {
        if (activo) {
          setCargandoEstudiantes(false);
        }
      }
    }

    cargarEstudiantes();

    return () => {
      activo = false;
    };
  }, [idExamen, recargaEstudiantes]);

  useEffect(() => {
    if (idExamen == null) {
      return;
    }

    let activo = true;

    async function cargarHistorial() {
      setCargandoHistorial(true);
      setErrorHistorial("");

      try {
        const datos = await listarHistorialExpulsiones(idExamen);

        if (!Array.isArray(datos)) {
          throw new Error("Historial de expulsiones inválido");
        }

        if (activo) {
          setHistorial(datos);
        }
      } catch (error) {
        if (activo) {
          setHistorial([]);

          if (error?.response?.status === 401) {
            setErrorHistorial(
              "Tu sesión ha expirado. Inicia sesión nuevamente.",
            );
          } else if (error?.response?.status === 403) {
            setErrorHistorial(
              "No tienes autorización para consultar el historial.",
            );
          } else {
            setErrorHistorial("No se pudo cargar el historial de expulsiones.");
          }
        }
      } finally {
        if (activo) {
          setCargandoHistorial(false);
        }
      }
    }

    cargarHistorial();

    return () => {
      activo = false;
    };
  }, [idExamen, recargaEstudiantes]);

  const examenesFiltrados = useMemo(() => {
    const texto = normalizarTexto(busquedaExamen);

    return examenes.filter((examen) => {
      const descripcion = normalizarTexto(
        [
          examen.codigo,
          examen.nombreExamen,
          obtenerNombreAsignatura(examen),
        ].join(" "),
      );

      return (
        (!texto || descripcion.includes(texto)) &&
        (!fechaFiltro || examen.fechaExamen === fechaFiltro)
      );
    });
  }, [examenes, busquedaExamen, fechaFiltro]);

  const estudiantesFiltrados = useMemo(() => {
    const texto = normalizarTexto(busquedaEstudiante);

    return estudiantes.filter((estudiante) =>
      normalizarTexto(
        `${estudiante.nombreCompleto} ${estudiante.codigoUniversitario}`,
      ).includes(texto),
    );
  }, [estudiantes, busquedaEstudiante]);

  function seleccionarExamen(examen) {
    setExamenSeleccionado(examen);
    setEstudiantes([]);
    setEstudianteSeleccionado(null);
    setBusquedaEstudiante("");
    setErrorRegistro("");
    setRegistroExitoso(null);
  }

  function seleccionarEstudiante(estudiante) {
    if (estudiante.expulsado || guardando) {
      return;
    }

    setEstudianteSeleccionado(estudiante);
    setFechaExpulsion(fechaActual());
    setHoraExpulsion(horaActual());
    setMotivo("");
    setObservaciones("");
    setErrorRegistro("");
    setRegistroExitoso(null);
  }

  function volverAExamenes() {
    if (guardando) {
      return;
    }

    setExamenSeleccionado(null);
    setEstudianteSeleccionado(null);
    setEstudiantes([]);
    setErrorRegistro("");
    setRegistroExitoso(null);
  }

  async function guardarExpulsion(evento) {
    evento.preventDefault();

    if (!estudianteSeleccionado || guardando || idExamen == null) {
      return;
    }

    const fechaHora = new Date(`${fechaExpulsion}T${horaExpulsion}`);

    if (Number.isNaN(fechaHora.getTime()) || !motivo.trim()) {
      setErrorRegistro("Completa la fecha, hora y motivo de la expulsión.");
      return;
    }

    const confirmado = window.confirm(
      `¿Confirmas la expulsión de ${estudianteSeleccionado.nombreCompleto} del examen ${examenSeleccionado.nombreExamen}?`,
    );

    if (!confirmado) {
      return;
    }

    setGuardando(true);
    setErrorRegistro("");

    try {
      await registrarExpulsion({
        idExamen: Number(idExamen),
        idEstudiante: Number(estudianteSeleccionado.idEstudiante),
        fechaHoraExpulsion: fechaHora.toISOString(),
        motivo: motivo.trim(),
        observaciones: observaciones.trim() || null,
      });

      setRegistroExitoso({
        estudiante: estudianteSeleccionado.nombreCompleto,
        examen: examenSeleccionado.nombreExamen,
      });

      setEstudiantes((anteriores) =>
        anteriores.map((estudiante) =>
          estudiante.idEstudiante === estudianteSeleccionado.idEstudiante
            ? { ...estudiante, expulsado: true }
            : estudiante,
        ),
      );

      setEstudianteSeleccionado(null);
      setRecargaEstudiantes((valor) => valor + 1);
    } catch (error) {
      setErrorRegistro(obtenerMensajeErrorExpulsion(error));

      if (error?.response?.status === 409) {
        setRecargaEstudiantes((valor) => valor + 1);
      }
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main className="expulsiones-pagina">
      <header className="expulsiones-encabezado">
        <div>
          <h1>Registrar expulsiones</h1>
          <p>
            {examenSeleccionado
              ? "Selecciona al estudiante y registra su expulsión."
              : "Selecciona el examen para gestionar sus expulsiones."}
          </p>
        </div>

        {examenSeleccionado && (
          <button
            type="button"
            className="expulsiones-boton-secundario"
            onClick={volverAExamenes}
            disabled={guardando}
          >
            Volver a exámenes
          </button>
        )}
      </header>

      {!examenSeleccionado ? (
        <section className="expulsiones-panel">
          <h2>Seleccionar examen</h2>

          <div className="expulsiones-filtros">
            <label>
              Buscar examen
              <input
                type="search"
                value={busquedaExamen}
                onChange={(evento) => setBusquedaExamen(evento.target.value)}
                placeholder="Nombre, código o asignatura"
              />
            </label>

            <label>
              Filtrar por fecha
              <input
                type="date"
                value={fechaFiltro}
                onChange={(evento) => setFechaFiltro(evento.target.value)}
              />
            </label>
          </div>

          {errorExamenes && (
            <p className="expulsiones-error" role="alert">
              {errorExamenes}
            </p>
          )}

          {cargandoExamenes ? (
            <p role="status">Cargando exámenes...</p>
          ) : (
            <div className="expulsiones-tabla-contenedor">
              <table className="expulsiones-tabla">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Examen</th>
                    <th>Asignatura</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {examenesFiltrados.map((examen) => (
                    <tr key={examen.idExamen ?? examen.id}>
                      <td>{examen.idExamen ?? examen.id}</td>
                      <td>{examen.nombreExamen || "—"}</td>
                      <td>{obtenerNombreAsignatura(examen)}</td>
                      <td>{examen.fechaExamen || "—"}</td>
                      <td>{examen.horaInicio || "—"}</td>
                      <td>
                        <button
                          type="button"
                          className="expulsiones-boton-principal"
                          onClick={() => seleccionarExamen(examen)}
                        >
                          Gestionar expulsiones
                        </button>
                      </td>
                    </tr>
                  ))}

                  {examenesFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={6} className="expulsiones-vacio">
                        No se encontraron exámenes.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <>
          <section className="expulsiones-panel expulsiones-informacion">
            <h2>Información del examen</h2>
            <div className="expulsiones-datos-examen">
              <span>
                <strong>Examen:</strong> {examenSeleccionado.nombreExamen}
              </span>
              <span>
                <strong>Asignatura:</strong>{" "}
                {obtenerNombreAsignatura(examenSeleccionado)}
              </span>
              <span>
                <strong>Fecha:</strong> {examenSeleccionado.fechaExamen || "—"}
              </span>
              <span>
                <strong>Hora:</strong> {examenSeleccionado.horaInicio || "—"}
              </span>
            </div>
          </section>

          <section className="expulsiones-panel expulsiones-historial">
            <div className="expulsiones-historial-encabezado">
              <h2>Historial de expulsiones</h2>

              <button
                type="button"
                className="expulsiones-boton-secundario"
                onClick={() => setRecargaEstudiantes((valor) => valor + 1)}
                disabled={cargandoHistorial}
              >
                Actualizar historial
              </button>
            </div>

            {errorHistorial && (
              <p className="expulsiones-error" role="alert">
                {errorHistorial}
              </p>
            )}

            {cargandoHistorial ? (
              <p role="status">Cargando historial de expulsiones...</p>
            ) : errorHistorial ? null : historial.length === 0 ? (
              <p>No existen expulsiones registradas para este examen.</p>
            ) : (
              <div className="expulsiones-tabla-contenedor">
                <table className="expulsiones-tabla">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Estudiante</th>
                      <th>Fecha de expulsión</th>
                      <th>Fecha de registro</th>
                      <th>Motivo</th>
                      <th>Observaciones</th>
                      <th>Responsable (ID)</th>
                    </tr>
                  </thead>

                  <tbody>
                    {historial.map((registro) => (
                      <tr key={registro.idExpulsion}>
                        <td>{registro.codigoUniversitario || "—"}</td>
                        <td>{registro.nombreCompleto || "—"}</td>
                        <td>
                          {formatearFechaHora(registro.fechaHoraExpulsion)}
                        </td>
                        <td>
                          {formatearFechaHora(registro.fechaHoraRegistro)}
                        </td>
                        <td>{registro.motivo || "—"}</td>
                        <td>{registro.observaciones || "—"}</td>
                        <td>{registro.idResponsable ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="expulsiones-columnas">
            <section className="expulsiones-panel">
              <h2>Estudiantes del examen</h2>

              <label className="expulsiones-busqueda">
                Buscar estudiante
                <input
                  type="search"
                  value={busquedaEstudiante}
                  onChange={(evento) =>
                    setBusquedaEstudiante(evento.target.value)
                  }
                  placeholder="Nombre o código universitario"
                />
              </label>

              {errorEstudiantes && (
                <p className="expulsiones-error" role="alert">
                  {errorEstudiantes}
                  <button
                    type="button"
                    onClick={() => setRecargaEstudiantes((valor) => valor + 1)}
                  >
                    Reintentar
                  </button>
                </p>
              )}

              {cargandoEstudiantes ? (
                <p role="status">Cargando estudiantes...</p>
              ) : (
                <div className="expulsiones-tabla-contenedor">
                  <table className="expulsiones-tabla">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Estudiante</th>
                        <th>Estado</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estudiantesFiltrados.map((estudiante) => (
                        <tr key={estudiante.idEstudiante}>
                          <td>{estudiante.codigoUniversitario || "—"}</td>
                          <td>{estudiante.nombreCompleto || "—"}</td>
                          <td>
                            <span
                              className={
                                estudiante.expulsado
                                  ? "expulsiones-estado expulsiones-estado-expulsado"
                                  : "expulsiones-estado expulsiones-estado-disponible"
                              }
                            >
                              {estudiante.expulsado
                                ? "Expulsado"
                                : "Sin expulsión"}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="expulsiones-boton-principal"
                              disabled={estudiante.expulsado || guardando}
                              onClick={() => seleccionarEstudiante(estudiante)}
                            >
                              {estudiante.expulsado
                                ? "Registrada"
                                : "Registrar"}
                            </button>
                          </td>
                        </tr>
                      ))}

                      {estudiantesFiltrados.length === 0 && (
                        <tr>
                          <td colSpan={4} className="expulsiones-vacio">
                            No se encontraron estudiantes.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="expulsiones-panel">
              {registroExitoso ? (
                <div className="expulsiones-resultado" role="status">
                  <span className="expulsiones-exito-icono">✓</span>
                  <h2>Expulsión registrada correctamente</h2>
                  <p>
                    La expulsión de {registroExitoso.estudiante} del examen{" "}
                    {registroExitoso.examen} ha sido registrada.
                  </p>
                  <button
                    type="button"
                    className="expulsiones-boton-principal"
                    onClick={() => setRegistroExitoso(null)}
                  >
                    Registrar otra expulsión
                  </button>
                </div>
              ) : estudianteSeleccionado ? (
                <>
                  <h2>Registrar expulsión</h2>
                  <p className="expulsiones-estudiante-actual">
                    <strong>Estudiante:</strong>{" "}
                    {estudianteSeleccionado.nombreCompleto}
                    <span>
                      Código: {estudianteSeleccionado.codigoUniversitario}
                    </span>
                  </p>

                  <form
                    className="expulsiones-formulario"
                    onSubmit={guardarExpulsion}
                  >
                    <div className="expulsiones-filtros">
                      <label>
                        Fecha de expulsión
                        <input
                          type="date"
                          value={fechaExpulsion}
                          onChange={(evento) =>
                            setFechaExpulsion(evento.target.value)
                          }
                          required
                        />
                      </label>

                      <label>
                        Hora de expulsión
                        <input
                          type="time"
                          value={horaExpulsion}
                          onChange={(evento) =>
                            setHoraExpulsion(evento.target.value)
                          }
                          required
                        />
                      </label>
                    </div>

                    <label>
                      Motivo de expulsión
                      <input
                        type="text"
                        list="expulsiones-motivos"
                        value={motivo}
                        onChange={(evento) => setMotivo(evento.target.value)}
                        placeholder="Selecciona o escribe el motivo"
                        maxLength={200}
                        required
                      />
                    </label>

                    <datalist id="expulsiones-motivos">
                      <option value="Uso de material no autorizado" />
                      <option value="Suplantación de identidad" />
                      <option value="Conducta inapropiada" />
                      <option value="Uso de dispositivo no permitido" />
                    </datalist>

                    <label>
                      Observaciones
                      <textarea
                        value={observaciones}
                        onChange={(evento) =>
                          setObservaciones(evento.target.value)
                        }
                        placeholder="Información adicional (opcional)"
                        rows={4}
                      />
                    </label>

                    {errorRegistro && (
                      <p className="expulsiones-error" role="alert">
                        {errorRegistro}
                      </p>
                    )}

                    <div className="expulsiones-acciones">
                      <button
                        type="button"
                        className="expulsiones-boton-secundario"
                        onClick={() => setEstudianteSeleccionado(null)}
                        disabled={guardando}
                      >
                        Cancelar
                      </button>

                      <button
                        type="submit"
                        className="expulsiones-boton-principal"
                        disabled={guardando || !motivo.trim()}
                      >
                        {guardando ? "Guardando..." : "Guardar registro"}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="expulsiones-instruccion">
                  <h2>Registrar expulsión</h2>
                  <p>
                    Selecciona un estudiante sin expulsión registrada para
                    completar el formulario.
                  </p>
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </main>
  );
}

export default Expulsiones;
