import {
  useCallback,
  useEffect,
  useState
} from "react";

import {
  consultarLogs,
  obtenerTiposLog
} from "../../services/logService";

import "./Auditoria.css";


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


function formatearFecha(valor) {

  if (!valor) {
    return "—";
  }

  const fecha =
    new Date(valor);

  return fecha.toLocaleString("es-BO", {

    day: "2-digit",
    month: "2-digit",
    year: "numeric",

    hour: "2-digit",
    minute: "2-digit",

  });
}


function Auditoria() {

  const [busqueda, setBusqueda] =
    useState("");

  const [tipoAccion, setTipoAccion] =
    useState("");

  const [tipos, setTipos] =
    useState([]);

  const [fechaDesde, setFechaDesde] =
    useState("");

  const [fechaHasta, setFechaHasta] =
    useState("");

  const [estado, setEstado] =
    useState("TODOS");

  const [pagina, setPagina] =
    useState(0);

  const [consultaAplicada, setConsultaAplicada] =
    useState({
      busqueda: "",
      tipoAccion: "",
      fechaDesde: "",
      fechaHasta: "",
      estado: "TODOS",
    });

  const [datos, setDatos] = useState({
    logs: [],
    total: 0,
    pagina: 0,
    tamanio: 10,
    totalPaginas: 0,
  });

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState("");

  const [busquedaRealizada, setBusquedaRealizada] =
    useState(false);


  const cargarLogs =
    useCallback(
      async (filtros, paginaSolicitada) => {

        setCargando(true);

        setError("");

        try {

          const respuesta =
            await consultarLogs({
              ...filtros,
              pagina: paginaSolicitada,
              tamanio: 10,
            });

          setDatos(respuesta);

        } catch (excepcion) {

          setError(excepcion.message);

          setDatos({
            logs: [],
            total: 0,
            pagina: 0,
            tamanio: 10,
            totalPaginas: 0,
          });

        } finally {

          setCargando(false);

        }
      },
      []
    );


  useEffect(() => {

    const ejecutarConsulta = async () => {

      await cargarLogs(
        consultaAplicada,
        pagina
      );

    };

    ejecutarConsulta();

  }, [
    cargarLogs,
    consultaAplicada,
    pagina
  ]);


  useEffect(() => {

    obtenerTiposLog()
      .then(setTipos)
      .catch(() =>
        setTipos([])
      );

  }, []);


  function buscar(evento) {

    evento.preventDefault();

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

    setBusqueda("");
    setTipoAccion("");
    setFechaDesde("");
    setFechaHasta("");
    setEstado("TODOS");

    setPagina(0);

    setBusquedaRealizada(false);

    setConsultaAplicada({
      busqueda: "",
      tipoAccion: "",
      fechaDesde: "",
      fechaHasta: "",
      estado: "TODOS",
    });
  }


  const desde =
    datos.total === 0
      ? 0
      : pagina * datos.tamanio
        + 1;


  const hasta =
    Math.min(
      (pagina + 1) * datos.tamanio,
      datos.total
    );


  return (

    <div className="auditoria-pagina">

      <header className="auditoria-encabezado">

        <h1>
          Auditoría
        </h1>

        <p>
          Bitácora de seguimiento de las
          operaciones realizadas en el sistema.
        </p>

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

            placeholder="
              Buscar por tipo, descripción
              o usuario responsable
            "

            aria-label="Buscar en auditoría"
          />

        </div>


        <label className="auditoria-filtro-select">

          <span>
            Tipo de acción
          </span>

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


        <label className="auditoria-filtro-fecha">

          <span>
            Desde
          </span>

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

          <span>
            Hasta
          </span>

          <input

            type="date"

            value={fechaHasta}

            onChange={
              (evento) =>
                setFechaHasta(evento.target.value)
            }

          />

        </label>


        <label className="auditoria-filtro-select">

          <span>
            Estado
          </span>

          <select

            value={estado}

            onChange={
              (evento) =>
                setEstado(evento.target.value)
            }
          >

            <option value="TODOS">
              Todos
            </option>

            <option value="EXITOSA">
              Exitosas
            </option>

            <option value="NO_EXITOSA">
              No exitosas
            </option>

          </select>

        </label>


        <button
          type="submit"
          className="auditoria-boton-buscar"
        >

          <IconoBuscar />

          Buscar

        </button>


        <button
          type="button"
          className="auditoria-boton-limpiar"
          onClick={limpiarFiltros}
        >

          Limpiar

        </button>

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
                  Espera un momento mientras
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
                        ? "No existen actividades que coincidan con los criterios de búsqueda."
                        : "Aún no hay operaciones registradas en la bitácora."
                    }

                  </p>

                </div>

              )
              : (

                <>

                  <h2>

                    Registros de actividad ({datos.total})

                  </h2>


                  <div className="auditoria-tabla-contenedor">

                    <table className="auditoria-tabla">

                      <thead>

                        <tr>

                          <th>Fecha</th>
                          <th>Usuario responsable</th>
                          <th>Tipo de acción</th>
                          <th>Descripción</th>
                          <th>IP de origen</th>
                          <th>Estado</th>

                        </tr>

                      </thead>


                      <tbody>

                        {
                          datos.logs.map(
                            (log) => (

                              <tr
                                key={log.idLog}
                              >

                                <td>
                                  {formatearFecha(log.fecha)}
                                </td>

                                <td>
                                  {log.nombreUsuario || "—"}
                                </td>

                                <td>
                                  <span className="auditoria-tipo">
                                    {log.tipoAccion}
                                  </span>
                                </td>

                                <td className="auditoria-descripcion">
                                  {log.descripcion}
                                </td>

                                <td>
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

                                    {
                                      log.exitosa
                                        ? "Exitosa"
                                        : "No exitosa"
                                    }

                                  </span>

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

                        onClick={
                          () =>
                            setPagina(
                              (valor) =>
                                Math.max(0, valor - 1)
                            )
                        }

                        disabled={pagina === 0}

                        aria-label="Página anterior"
                      >
                        ‹
                      </button>


                      <span>
                        {pagina + 1}
                      </span>


                      <button

                        type="button"

                        onClick={
                          () =>
                            setPagina((valor) => valor + 1)
                        }

                        disabled={
                          pagina + 1 >= datos.totalPaginas
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

    </div>

  );
}


export default Auditoria;