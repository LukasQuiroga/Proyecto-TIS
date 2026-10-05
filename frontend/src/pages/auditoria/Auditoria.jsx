import {
  useEffect,
  useState
} from "react";

import {
  consultarLogs,
  obtenerLogPorId,
  obtenerTiposLog,
  TAMANIO_PAGINA_AUDITORIA
} from "../../services/logService";

import "./Auditoria.css";


const ESTADOS_AUDITORIA = Object.freeze({
  TODOS: "TODOS",
  EXITOSA: "EXITOSA",
  NO_EXITOSA: "NO_EXITOSA",
});


function IconoBuscar() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="11"
        cy="11"
        r="7"
      />

      <path d="m20 20-4-4" />
    </svg>
  );
}


function IconoVer() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle
        cx="12"
        cy="12"
        r="2.5"
      />
    </svg>
  );
}


function formatearFecha(valor) {
  if (!valor) {
    return "—";
  }

  const fecha = new Date(valor);

  return fecha.toLocaleString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}


function Auditoria() {
  const [busqueda, setBusqueda] = useState("");
  const [tipoAccion, setTipoAccion] = useState("");
  const [tipos, setTipos] = useState([]);
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [estado, setEstado] = useState(
    ESTADOS_AUDITORIA.TODOS
  );

  const [pagina, setPagina] = useState(0);

  const [consultaAplicada, setConsultaAplicada] = useState({
    busqueda: "",
    tipoAccion: "",
    fechaDesde: "",
    fechaHasta: "",
    estado: ESTADOS_AUDITORIA.TODOS,
  });

  const [datos, setDatos] = useState({
    logs: [],
    total: 0,
    pagina: 0,
    tamanio: TAMANIO_PAGINA_AUDITORIA,
    totalPaginas: 0,
  });

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busquedaRealizada, setBusquedaRealizada] =
    useState(false);

  const [detalle, setDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] =
    useState(false);
  const [errorDetalle, setErrorDetalle] =
    useState("");


 useEffect(() => {
  let componenteActivo = true;

  consultarLogs({
    ...consultaAplicada,
    pagina,
    tamanio: TAMANIO_PAGINA_AUDITORIA,
  })
    .then((respuesta) => {
      if (!componenteActivo) {
        return;
      }

      setDatos(respuesta);
      setError("");
    })
    .catch((excepcion) => {
      if (!componenteActivo) {
        return;
      }

      setError(
        excepcion.message
        || "No se pudo recuperar la auditoría."
      );

      setDatos({
        logs: [],
        total: 0,
        pagina: 0,
        tamanio: TAMANIO_PAGINA_AUDITORIA,
        totalPaginas: 0,
      });
    })
    .finally(() => {
      if (componenteActivo) {
        setCargando(false);
      }
    });

  return () => {
    componenteActivo = false;
  };
}, [
  consultaAplicada,
  pagina
]);


  useEffect(() => {
    obtenerTiposLog()
      .then(setTipos)
      .catch(() => setTipos([]));
  }, []);


  function buscar(evento) {
    evento.preventDefault();

    setCargando(true);
    setPagina(0);
    setBusquedaRealizada(true);

    setConsultaAplicada({
      busqueda,
      tipoAccion,
      fechaDesde,
      fechaHasta,
      estado,
    });
  }


  function limpiarFiltros() {
    setCargando(true);

    setBusqueda("");
    setTipoAccion("");
    setFechaDesde("");
    setFechaHasta("");
    setEstado(ESTADOS_AUDITORIA.TODOS);

    setPagina(0);
    setBusquedaRealizada(false);

    setConsultaAplicada({
      busqueda: "",
      tipoAccion: "",
      fechaDesde: "",
      fechaHasta: "",
      estado: ESTADOS_AUDITORIA.TODOS,
    });
  }


  async function verDetalle(idLog) {
    setCargandoDetalle(true);
    setErrorDetalle("");

    try {
      const respuesta = await obtenerLogPorId(idLog);
      setDetalle(respuesta);
    } catch (excepcion) {
      setErrorDetalle(
        excepcion.message
        || "No se pudo cargar el detalle."
      );
    } finally {
      setCargandoDetalle(false);
    }
  }


  function cerrarDetalle() {
    setDetalle(null);
    setErrorDetalle("");
  }


  const paginaActual = datos.pagina ?? pagina;

  const desde =
    datos.total === 0
      ? 0
      : paginaActual * datos.tamanio + 1;

  const hasta = Math.min(
    (paginaActual + 1) * datos.tamanio,
    datos.total
  );


  return (
    <div className="auditoria-pagina">

      <header className="auditoria-encabezado">
        <div>
          <h1>Auditoría del sistema</h1>

          <p>
            Consulte las operaciones registradas
            y mantenga la trazabilidad de las
            acciones realizadas en el sistema.
          </p>
        </div>

        <div className="auditoria-resumen">
          <span>Registros encontrados</span>
          <strong>{datos.total}</strong>
        </div>
      </header>


      {
        error && (
          <div className="auditoria-alerta auditoria-alerta-error">
            <span className="auditoria-alerta-icono">
              !
            </span>

            <div>
              <strong>
                No se pudo realizar la consulta.
              </strong>

              <p>{error}</p>
            </div>
          </div>
        )
      }


      <form
        className="auditoria-filtros"
        onSubmit={buscar}
      >

        <div className="auditoria-busqueda">
          <IconoBuscar />

          <input
            type="text"
            value={busqueda}
            onChange={
              (evento) =>
                setBusqueda(evento.target.value)
            }
            placeholder="Buscar por usuario, acción o descripción"
            aria-label="Buscar en auditoría"
          />
        </div>


        <label className="auditoria-filtro-select">
          <span>Tipo de acción</span>

          <select
            value={tipoAccion}
            onChange={
              (evento) =>
                setTipoAccion(evento.target.value)
            }
          >
            <option value="">
              Todos
            </option>

            {
              tipos.map(
                (tipo) => (
                  <option
                    key={tipo}
                    value={tipo}
                  >
                    {tipo}
                  </option>
                )
              )
            }
          </select>
        </label>


        <label className="auditoria-filtro-select">
          <span>Estado</span>

          <select
            value={estado}
            onChange={
              (evento) =>
                setEstado(evento.target.value)
            }
          >
            <option value={ESTADOS_AUDITORIA.TODOS}>
              Todos
            </option>

            <option value={ESTADOS_AUDITORIA.EXITOSA}>
              Exitosas
            </option>

            <option value={ESTADOS_AUDITORIA.NO_EXITOSA}>
              No exitosas
            </option>
          </select>
        </label>


        <label className="auditoria-filtro-fecha">
          <span>Desde</span>

          <input
            type="date"
            value={fechaDesde}
            onChange={
              (evento) =>
                setFechaDesde(evento.target.value)
            }
          />
        </label>


        <label className="auditoria-filtro-fecha">
          <span>Hasta</span>

          <input
            type="date"
            value={fechaHasta}
            onChange={
              (evento) =>
                setFechaHasta(evento.target.value)
            }
          />
        </label>


        <div className="auditoria-filtros-acciones">
          <button
            type="submit"
            className="auditoria-boton-buscar"
          >
            <IconoBuscar />
            Filtrar
          </button>

          <button
            type="button"
            className="auditoria-boton-limpiar"
            onClick={limpiarFiltros}
          >
            Limpiar
          </button>
        </div>

      </form>


      <section className="auditoria-panel-resultados">

        {
          cargando
            ? (
              <div className="auditoria-estado-vacio">

                <div className="auditoria-cargando" />

                <h2>
                  Consultando registros
                </h2>

                <p>
                  Espere un momento mientras
                  recuperamos la información.
                </p>

              </div>
            )
            : datos.logs.length === 0
              ? (
                <div className="auditoria-estado-vacio">

                  <div className="auditoria-vacio-icono">
                    <IconoBuscar />
                  </div>

                  <h2>
                    No se encontraron registros
                  </h2>

                  <p>
                    {
                      busquedaRealizada
                        ? "No existen actividades que coincidan con los filtros aplicados."
                        : "Aún no hay operaciones registradas en la bitácora."
                    }
                  </p>

                </div>
              )
              : (
                <>
                  <div className="auditoria-resultados-cabecera">
                    <div>
                      <h2>
                        Registros de actividad
                      </h2>

                      <p>
                        Historial de operaciones
                        realizadas en el sistema.
                      </p>
                    </div>
                  </div>


                  <div className="auditoria-tabla-contenedor">

                    <table className="auditoria-tabla">

                      <thead>
                        <tr>
                          <th>Fecha y hora</th>
                          <th>Usuario responsable</th>
                          <th>Tipo de acción</th>
                          <th>Descripción</th>
                          <th>IP de origen</th>
                          <th>Estado</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>


                      <tbody>
                        {
                          datos.logs.map(
                            (log) => (
                              <tr key={log.idLog}>

                                <td className="auditoria-fecha">
                                  {formatearFecha(log.fecha)}
                                </td>

                                <td>
                                  <div className="auditoria-usuario">
                                    <span>
                                      {log.nombreUsuario || "Usuario no identificado"}
                                    </span>

                                    {
                                      log.idUsuario && (
                                        <small>
                                          ID {log.idUsuario}
                                        </small>
                                      )
                                    }
                                  </div>
                                </td>

                                <td>
                                  <span className="auditoria-tipo">
                                    {log.tipoAccion}
                                  </span>
                                </td>

                                <td className="auditoria-descripcion">
                                  {log.descripcion}
                                </td>

                                <td className="auditoria-ip">
                                  {log.ipOrigen || "—"}
                                </td>

                                <td>
                                  <span
                                    className={
                                      `auditoria-estado ${
                                        log.exitosa
                                          ? "auditoria-estado-exitosa"
                                          : "auditoria-estado-noexitosa"
                                      }`
                                    }
                                  >
                                    {log.exitosa
                                      ? "Exitosa"
                                      : "No exitosa"}
                                  </span>
                                </td>

                                <td>
                                  <button
                                    type="button"
                                    className="auditoria-boton-ver"
                                    onClick={
                                      () => verDetalle(log.idLog)
                                    }
                                  >
                                    <IconoVer />
                                    Ver
                                  </button>
                                </td>

                              </tr>
                            )
                          )
                        }
                      </tbody>

                    </table>

                  </div>


                  <div className="auditoria-paginacion-fila">

                    <span>
                      Mostrando {desde} a {hasta} de {datos.total}
                    </span>

                    <div className="auditoria-paginacion">

                      <button
                        type="button"
                        onClick={() => {
                          setCargando(true);

                          setPagina(
                            (valor) =>
                              Math.max(0, valor - 1)
                          );
                        }}
                        disabled={paginaActual === 0}
                        aria-label="Página anterior"
                      >
                        ‹
                      </button>

                      <span>
                        Página {paginaActual + 1}
                        {
                          datos.totalPaginas > 0
                            ? ` de ${datos.totalPaginas}`
                            : ""
                        }
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setCargando(true);

                          setPagina(
                            (valor) => valor + 1
                          );
                        }}
                        disabled={
                          paginaActual + 1
                          >= datos.totalPaginas
                        }
                        aria-label="Página siguiente"
                      >
                        ›
                      </button>

                    </div>

                  </div>
                </>
              )
        }

      </section>


      {
        (detalle || cargandoDetalle || errorDetalle) && (

          <div
            className="auditoria-modal-fondo"
            role="presentation"
            onMouseDown={
              (evento) => {
                if (
                  evento.target === evento.currentTarget
                ) {
                  cerrarDetalle();
                }
              }
            }
          >

            <section
              className="auditoria-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="auditoria-detalle-titulo"
            >

              <div className="auditoria-modal-cabecera">

                <div>
                  <span className="auditoria-modal-etiqueta">
                    Auditoría
                  </span>

                  <h2 id="auditoria-detalle-titulo">
                    Detalle de operación
                  </h2>
                </div>

                <button
                  type="button"
                  className="auditoria-modal-cerrar"
                  onClick={cerrarDetalle}
                  aria-label="Cerrar detalle"
                >
                  ×
                </button>

              </div>


              {
                cargandoDetalle
                  ? (
                    <div className="auditoria-detalle-cargando">
                      <div className="auditoria-cargando" />

                      <p>
                        Cargando detalle...
                      </p>
                    </div>
                  )
                  : errorDetalle
                    ? (
                      <div className="auditoria-alerta auditoria-alerta-error">
                        <span className="auditoria-alerta-icono">
                          !
                        </span>

                        <div>
                          <strong>
                            No se pudo cargar el detalle.
                          </strong>

                          <p>{errorDetalle}</p>
                        </div>
                      </div>
                    )
                    : detalle && (
                      <>
                        <div className="auditoria-detalle-resumen">

                          <div>
                            <span>ID de operación</span>
                            <strong>
                              #{detalle.idLog}
                            </strong>
                          </div>

                          <div>
                            <span>Estado</span>

                            <strong
                              className={
                                detalle.exitosa
                                  ? "auditoria-texto-exitoso"
                                  : "auditoria-texto-error"
                              }
                            >
                              {detalle.exitosa
                                ? "Exitosa"
                                : "No exitosa"}
                            </strong>
                          </div>

                        </div>


                        <div className="auditoria-detalle-grid">

                          <div className="auditoria-detalle-campo">
                            <span>Usuario responsable</span>
                            <strong>
                              {detalle.nombreUsuario || "Sin usuario asociado"}
                            </strong>
                          </div>

                          <div className="auditoria-detalle-campo">
                            <span>ID de usuario</span>
                            <strong>
                              {detalle.idUsuario || "—"}
                            </strong>
                          </div>

                          <div className="auditoria-detalle-campo">
                            <span>Tipo de acción</span>
                            <strong>
                              {detalle.tipoAccion}
                            </strong>
                          </div>

                          <div className="auditoria-detalle-campo">
                            <span>Fecha y hora</span>
                            <strong>
                              {formatearFecha(detalle.fecha)}
                            </strong>
                          </div>

                          <div className="auditoria-detalle-campo">
                            <span>IP de origen</span>
                            <strong>
                              {detalle.ipOrigen || "—"}
                            </strong>
                          </div>

                        </div>


                        <div className="auditoria-detalle-descripcion">
                          <span>Descripción de la operación</span>

                          <p>
                            {detalle.descripcion}
                          </p>
                        </div>


                        <div className="auditoria-modal-pie">
                          <button
                            type="button"
                            className="auditoria-boton-cerrar-detalle"
                            onClick={cerrarDetalle}
                          >
                            Cerrar
                          </button>
                        </div>
                      </>
                    )
              }

            </section>

          </div>
        )
      }

    </div>
  );
}


export default Auditoria;