
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiCalendar,
  FiEye,
  FiFileText,
  FiFilter,
  FiSearch,
  FiX,
} from "react-icons/fi";

import {
  listarIngresosRegistrados,
  obtenerExamenesIngreso,
  obtenerIngresoRegistrado,
} from "../../services/validacionHabilitacionService";

import "./IngresosRegistrados.css";

function formatearId(id) {
  if (id == null) return "-";
  return `IG-${String(id).padStart(3, "0")}`;
}

function formatearFecha(valor) {
  if (!valor) return "-";

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) return "-";

  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");

  return `${dia}/${mes}/${fecha.getFullYear()}`;
}

function formatearHora(valor) {
  if (!valor) return "-";

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) return "-";

  const horas = String(fecha.getHours()).padStart(2, "0");
  const minutos = String(fecha.getMinutes()).padStart(2, "0");
  const segundos = String(fecha.getSeconds()).padStart(2, "0");

  return `${horas}:${minutos}:${segundos}`;
}

function mensajeError(error, mensajePredeterminado) {
  return (
    error?.response?.data?.mensaje ||
    error?.response?.data?.message ||
    mensajePredeterminado
  );
}

function IngresosRegistrados() {
  const location = useLocation();
  const navigate = useNavigate();

  const [examenes, setExamenes] = useState([]);
  const [ingresos, setIngresos] = useState([]);

  const [q, setQ] = useState("");
  const [idExamen, setIdExamen] = useState("");
  const [fecha, setFecha] = useState("");

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [pagina, setPagina] = useState(1);

  const [ingresoSeleccionado, setIngresoSeleccionado] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const solicitudListado = useRef(0);
  const solicitudDetalle = useRef(0);

  const porPagina = 5;

  // Cargar los examenes disponibles.
  useEffect(() => {
    let activo = true;

    obtenerExamenesIngreso()
      .then((datos) => {
        if (activo) {
          setExamenes(Array.isArray(datos) ? datos : []);
        }
      })
      .catch(() => {
        if (activo) {
          setError("No se pudieron cargar los exámenes.");
        }
      });

    return () => {
      activo = false;
    };
  }, []);

  // Consultar ingresos registrados.
  const cargar = useCallback(async (filtros = {}) => {
    const idSolicitud = ++solicitudListado.current;

    setCargando(true);
    setError("");

    try {
      const datos = await listarIngresosRegistrados(filtros);

      if (idSolicitud !== solicitudListado.current) return;

      setIngresos(Array.isArray(datos) ? datos : []);
      setPagina(1);
    } catch (err) {
      if (idSolicitud !== solicitudListado.current) return;

      setIngresos([]);
      setPagina(1);

      setError(
        mensajeError(
          err,
          "No se pudieron cargar los ingresos registrados."
        )
      );
    } finally {
      if (idSolicitud === solicitudListado.current) {
        setCargando(false);
      }
    }
  }, []);

  // CORRECCION ESLINT: primera carga asincrona.
  useEffect(() => {
    let activo = true;

    Promise.resolve().then(() => {
      if (activo) {
        cargar({});
      }
    });

    return () => {
      activo = false;
      solicitudListado.current += 1;
    };
  }, [cargar]);

  // Aplicar filtros seleccionados.
  const aplicarFiltros = () => {
    if (cargando) return;

    cargar({
      q: q.trim(),
      idExamen,
      fecha,
    });
  };

  // Paginacion.
  const total = ingresos.length;

  const totalPaginas = Math.max(
    1,
    Math.ceil(total / porPagina)
  );

  const paginaActual = Math.min(pagina, totalPaginas);

  const inicio = (paginaActual - 1) * porPagina;

  const datosPagina = ingresos.slice(
    inicio,
    inicio + porPagina
  );

  const paginas = useMemo(
    () => Array.from(
      { length: totalPaginas },
      (_, i) => i + 1
    ),
    [totalPaginas]
  );

  const cambiarPagina = (nuevaPagina) => {
    if (
      nuevaPagina >= 1 &&
      nuevaPagina <= totalPaginas
    ) {
      setPagina(nuevaPagina);
    }
  };

  // Consultar detalle del ingreso.
  const abrirDetalle = useCallback(async (idIngreso) => {
    const idSolicitud = ++solicitudDetalle.current;

    setCargandoDetalle(true);
    setError("");

    try {
      const detalle = await obtenerIngresoRegistrado(idIngreso);

      if (idSolicitud === solicitudDetalle.current) {
        setIngresoSeleccionado(detalle);
      }
    } catch (err) {
      if (idSolicitud === solicitudDetalle.current) {
        setError(
          mensajeError(
            err,
            "No se pudo cargar el ingreso seleccionado."
          )
        );
      }
    } finally {
      if (idSolicitud === solicitudDetalle.current) {
        setCargandoDetalle(false);
      }
    }
  }, []);

  // CORRECCION ESLINT: abrir detalle desde otra pantalla.
  useEffect(() => {
    const idIngreso = location.state?.idIngreso;

    if (!idIngreso) return;

    let activo = true;

    Promise.resolve().then(() => {
      if (!activo) return;

      abrirDetalle(idIngreso);

      navigate(location.pathname, {
        replace: true,
        state: null,
      });
    });

    return () => {
      activo = false;
    };
  }, [
    location.state?.idIngreso,
    location.pathname,
    navigate,
    abrirDetalle,
  ]);

  // Cerrar el modal.
  const cerrarModal = useCallback(() => {
    setIngresoSeleccionado(null);
  }, []);

  // Cerrar el modal con Escape.
  useEffect(() => {
    if (!ingresoSeleccionado) return;

    const cerrarConEscape = (event) => {
      if (event.key === "Escape") {
        cerrarModal();
      }
    };

    document.addEventListener(
      "keydown",
      cerrarConEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        cerrarConEscape
      );
    };
  }, [ingresoSeleccionado, cerrarModal]);

  return (
    <main className="ingresos-registrados-pagina">
      <header className="ingresos-registrados-encabezado">
        <h1>Ingresos registrados</h1>

        <p>
          Consulte la fecha y hora de los ingresos
          autorizados de los estudiantes.
        </p>
      </header>

      <section className="ingresos-registrados-contenedor">

        {/* FILTROS */}
        <div className="ingresos-registrados-filtros">

          {/* BUSCADOR */}
          <div className="ingresos-registrados-buscador">
            <FiSearch className="ingresos-registrados-buscador-icono" />

            <input
              type="text"
              placeholder="Buscar estudiante por código o nombre..."
              value={q}
              onChange={(event) => setQ(event.target.value)}
              maxLength={100}
              aria-label="Buscar estudiante por código o nombre"
            />
          </div>

          {/* FILTRO POR EXAMEN */}
          <div className="ingresos-registrados-campo">
            <label htmlFor="filtro-examen-ingreso">
              Examen
            </label>

            <select
              id="filtro-examen-ingreso"
              value={idExamen}
              onChange={(event) =>
                setIdExamen(event.target.value)
              }
            >
              <option value="">Todos</option>

              {examenes.map((examen) => (
                <option
                  key={examen.idExamen}
                  value={examen.idExamen}
                >
                  {examen.codigo && examen.nombreExamen
                    ? `${examen.codigo} - ${examen.nombreExamen}`
                    : examen.nombreExamen || examen.codigo}
                </option>
              ))}
            </select>
          </div>

          {/* FILTRO POR FECHA */}
          <div className="ingresos-registrados-campo">
            <label htmlFor="filtro-fecha-ingreso">
              Fecha
            </label>

            <div className="ingresos-registrados-fecha-wrapper">
              <FiCalendar className="ingresos-registrados-fecha-icono" />

              <input
                id="filtro-fecha-ingreso"
                type="date"
                value={fecha}
                onChange={(event) =>
                  setFecha(event.target.value)
                }
              />
            </div>
          </div>

          {/* BOTON FILTRAR */}
          <button
            type="button"
            className="ingresos-registrados-boton-filtrar"
            onClick={aplicarFiltros}
            disabled={cargando}
          >
            <FiFilter />

            <span>
              {cargando ? "Filtrando..." : "Filtrar"}
            </span>
          </button>
        </div>

        {/* MENSAJE DE RESULTADOS */}
        <div
          className={`ingresos-registrados-mensaje ${
            error
              ? "ingresos-registrados-mensaje-error"
              : ""
          }`}
          role={error ? "alert" : "status"}
          aria-live="polite"
        >
          <div className="ingresos-registrados-mensaje-icono">
            <FiFileText />
          </div>

          <span>
            {cargando
              ? "Cargando ingresos registrados..."
              : error
                ? error
                : total === 0
                  ? "No se encontraron ingresos registrados."
                  : `Se encontraron ${total} ingreso${
                      total === 1 ? "" : "s"
                    } registrado${
                      total === 1 ? "" : "s"
                    }.`}
          </span>
        </div>

        {/* TABLA */}
        <div className="ingresos-registrados-tabla-contenedor">
          <table className="ingresos-registrados-tabla">
            <thead>
              <tr>
                <th>ID</th>
                <th>Código</th>
                <th>Estudiante</th>
                <th>Examen</th>
                <th>Ambiente</th>
                <th>Fecha de ingreso</th>
                <th>Hora de ingreso</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {!cargando &&
                datosPagina.map((ingreso) => (
                  <tr key={ingreso.idIngreso}>
                    <td>
                      {formatearId(ingreso.idIngreso)}
                    </td>

                    <td>
                      {ingreso.codigoUniversitario || "-"}
                    </td>

                    <td className="ingresos-registrados-estudiante">
                      {ingreso.nombreEstudiante || "-"}
                    </td>

                    <td>
                      {ingreso.nombreExamen || "-"}
                    </td>

                    <td>
                      {ingreso.ambiente || "-"}
                    </td>

                    <td>
                      {formatearFecha(
                        ingreso.fechaHoraIngreso
                      )}
                    </td>

                    <td>
                      {formatearHora(
                        ingreso.fechaHoraIngreso
                      )}
                    </td>

                    <td>
                      <span
                        className={`ingresos-registrados-estado ${
                          ingreso.estado === "SUSPENDIDO"
                            ? "ingresos-registrados-estado-suspendido"
                            : ""
                        }`}
                      >
                        {ingreso.estado || "REGISTRADO"}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="ingresos-registrados-boton-ver"
                        title="Ver detalle"
                        aria-label={`Ver ingreso de ${
                          ingreso.nombreEstudiante || "estudiante"
                        }`}
                        onClick={() =>
                          abrirDetalle(ingreso.idIngreso)
                        }
                        disabled={cargandoDetalle}
                      >
                        <FiEye />
                      </button>
                    </td>
                  </tr>
                ))}

              {!cargando && datosPagina.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="ingresos-registrados-sin-resultados"
                  >
                    {error
                      ? "No se pudo obtener la información."
                      : "No hay ingresos registrados para los filtros seleccionados."}
                  </td>
                </tr>
              )}

              {cargando && (
                <tr>
                  <td
                    colSpan={9}
                    className="ingresos-registrados-sin-resultados"
                  >
                    Cargando registros...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINACION */}
        <div className="ingresos-registrados-paginacion">
          <div className="ingresos-registrados-paginacion-info">
            Mostrando{" "}
            {total === 0 ? 0 : inicio + 1}
            {" - "}
            {Math.min(inicio + porPagina, total)}
            {" de "}
            {total} ingresos registrados
          </div>

          <div className="ingresos-registrados-paginacion-controles">
            <button
              type="button"
              className="ingresos-registrados-paginacion-boton"
              onClick={() =>
                cambiarPagina(paginaActual - 1)
              }
              disabled={
                cargando || paginaActual === 1
              }
              aria-label="Página anterior"
            >
              ‹
            </button>

            {paginas.map((numero) => (
              <button
                key={numero}
                type="button"
                className={`ingresos-registrados-paginacion-boton ${
                  numero === paginaActual
                    ? "activa"
                    : ""
                }`}
                onClick={() => cambiarPagina(numero)}
                disabled={cargando}
                aria-label={`Página ${numero}`}
                aria-current={
                  numero === paginaActual
                    ? "page"
                    : undefined
                }
              >
                {numero}
              </button>
            ))}

            <button
              type="button"
              className="ingresos-registrados-paginacion-boton"
              onClick={() =>
                cambiarPagina(paginaActual + 1)
              }
              disabled={
                cargando ||
                paginaActual === totalPaginas
              }
              aria-label="Página siguiente"
            >
              ›
            </button>
          </div>
        </div>
      </section>

      {/* MODAL DE CONSULTA */}
      {ingresoSeleccionado && (
        <div
          className="ingresos-registrados-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              cerrarModal();
            }
          }}
        >
          <div
            className="ingresos-registrados-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detalle-ingreso-titulo"
          >
            <div className="ingresos-registrados-modal-header">
              <h2 id="detalle-ingreso-titulo">
                Detalle de ingreso
              </h2>

              <button
                type="button"
                onClick={cerrarModal}
                className="ingresos-registrados-modal-close"
                aria-label="Cerrar detalle"
              >
                <FiX />
              </button>
            </div>

            <div className="ingresos-registrados-modal-body">
              <div className="ingresos-registrados-modal-grid">

                <div>
                  <label>ID</label>
                  <p>
                    {formatearId(
                      ingresoSeleccionado.idIngreso
                    )}
                  </p>
                </div>

                <div>
                  <label>Código</label>
                  <p>
                    {ingresoSeleccionado.codigoUniversitario || "-"}
                  </p>
                </div>

                <div>
                  <label>Estudiante</label>
                  <p>
                    {ingresoSeleccionado.nombreEstudiante || "-"}
                  </p>
                </div>

                <div>
                  <label>Examen</label>
                  <p>
                    {ingresoSeleccionado.nombreExamen || "-"}
                  </p>
                </div>

                <div>
                  <label>Ambiente</label>
                  <p>
                    {ingresoSeleccionado.ambiente || "-"}
                  </p>
                </div>

                <div>
                  <label>Fecha de ingreso</label>
                  <p>
                    {formatearFecha(
                      ingresoSeleccionado.fechaHoraIngreso
                    )}
                  </p>
                </div>

                <div>
                  <label>Hora de ingreso</label>
                  <p>
                    {formatearHora(
                      ingresoSeleccionado.fechaHoraIngreso
                    )}
                  </p>
                </div>

                <div>
                  <label>Fecha/Hora de salida</label>
                  <p>
                    {ingresoSeleccionado.fechaHoraSalida
                      ? `${formatearFecha(
                          ingresoSeleccionado.fechaHoraSalida
                        )} ${formatearHora(
                          ingresoSeleccionado.fechaHoraSalida
                        )}`
                      : "-"}
                  </p>
                </div>

                <div>
                  <label>Estado</label>
                  <p>
                    {ingresoSeleccionado.estado || "REGISTRADO"}
                  </p>
                </div>

                <div>
                  <label>Motivo de suspensión</label>
                  <p>
                    {ingresoSeleccionado.motivoSuspension || "-"}
                  </p>
                </div>

                <div>
                  <label>Motivo de reincorporación</label>
                  <p>
                    {ingresoSeleccionado.motivoReincorporacion || "-"}
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default IngresosRegistrados;
