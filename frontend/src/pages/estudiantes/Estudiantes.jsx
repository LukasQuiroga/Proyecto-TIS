import {
  useCallback,
  useEffect,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import Navbar
  from "../../components/Navbar/Navbar";

import Sidebar
  from "../../components/Sidebar/Sidebar";

import {
  consultarEstudiantes,
  obtenerCarreras,
} from "../../services/estudianteService";

import "./Estudiantes.css";


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

      <path
        d="
          M2.5 12
          s3.5-6 9.5-6
          9.5 6 9.5 6
          -3.5 6-9.5 6
          -9.5-6-9.5-6Z
        "
      />

      <circle
        cx="12"
        cy="12"
        r="2.5"
      />

    </svg>
  );
}


function Estudiantes() {

  const navigate =
    useNavigate();

  const [
    busqueda,
    setBusqueda
  ] = useState("");

  const [
    estado,
    setEstado
  ] = useState("TODOS");

  const [
    carrera,
    setCarrera
  ] = useState("");

  const [
    carreras,
    setCarreras
  ] = useState([]);

  const [
    pagina,
    setPagina
  ] = useState(0);

  const [
    consultaAplicada,
    setConsultaAplicada
  ] = useState({
    busqueda: "",
    estado: "TODOS",
    carrera: "",
  });

  const [
    datos,
    setDatos
  ] = useState({

    estudiantes: [],

    total: 0,

    pagina: 0,

    tamanio: 10,

    totalPaginas: 0,

  });

  const [
    cargando,
    setCargando
  ] = useState(true);

  const [
    error,
    setError
  ] = useState("");

  const [
    busquedaRealizada,
    setBusquedaRealizada
  ] = useState(false);


  const cargarEstudiantes =
    useCallback(
      async (
        filtros,
        paginaSolicitada
      ) => {

        setCargando(true);

        setError("");

        try {

          const respuesta =
            await consultarEstudiantes({

              ...filtros,

              pagina:
                paginaSolicitada,

              tamanio: 10,

            });

          setDatos(respuesta);

        } catch (excepcion) {

          setError(
            excepcion.message
          );

          setDatos({

            estudiantes: [],

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

    await cargarEstudiantes(
      consultaAplicada,
      pagina
    );

  };


  ejecutarConsulta();


}, [
  cargarEstudiantes,
  consultaAplicada,
  pagina
]);

  useEffect(() => {

    obtenerCarreras()
      .then(setCarreras)
      .catch(() =>
        setCarreras([])
      );

  }, []);


  function buscar(evento) {

    evento.preventDefault();

    setPagina(0);

    setBusquedaRealizada(true);

    setConsultaAplicada({
      busqueda,
      estado,
      carrera
    });
  }


  function limpiarBusqueda() {
    setBusqueda("");
  }


  const desde =
    datos.total === 0
      ? 0
      : pagina *
          datos.tamanio
        + 1;


  const hasta =
    Math.min(
      (pagina + 1) *
        datos.tamanio,
      datos.total
    );


  return (

    <div className="inicio-pagina">

      <Sidebar />


      <div
        className="
          inicio-zona-principal
          estudiantes-zona-principal
        "
      >

        <Navbar />


        <main
          className="estudiantes-contenido"
        >

          <header
            className="estudiantes-encabezado"
          >

            <h1>
              Consulta de estudiantes
            </h1>

            <p>
              Busca y visualiza la
              información de los
              estudiantes registrados
              en el sistema.
            </p>

          </header>


          {
            busquedaRealizada &&
            !cargando &&
            !error &&
            datos.total > 0
            && (

              <div
                className="
                  estudiantes-alerta
                  estudiantes-alerta-exito
                "
              >

                <span
                  className="
                    estudiantes-alerta-icono
                  "
                >
                  ✓
                </span>

                <div>

                  <strong>
                    Se encontraron
                    resultados.
                  </strong>

                  <p>

                    Se{" "}

                    {
                      datos.total === 1
                        ? "ha encontrado"
                        : "han encontrado"
                    }

                    {" "}
                    {datos.total}
                    {" "}

                    {
                      datos.total === 1
                        ? "estudiante"
                        : "estudiantes"
                    }

                    {" "}
                    que coinciden con
                    tu búsqueda.

                  </p>

                </div>

              </div>
            )
          }


          {
            error && (

              <div
                className="
                  estudiantes-alerta
                  estudiantes-alerta-error
                "
              >

                <span
                  className="
                    estudiantes-alerta-icono
                  "
                >
                  !
                </span>

                <div>

                  <strong>
                    No se pudo realizar
                    la consulta.
                  </strong>

                  <p>{error}</p>

                </div>

              </div>
            )
          }


          <form
            className="estudiantes-filtros"
            onSubmit={buscar}
          >

            <div
              className="estudiantes-busqueda"
            >

              <IconoBuscar />


              <input

                type="text"

                value={busqueda}

                onChange={
                  (evento) =>
                    setBusqueda(
                      evento.target.value
                    )
                }

                placeholder="
                  Código, documento,
                  nombres o apellidos
                "

                aria-label="
                  Buscar estudiante
                "
              />


              {
                busqueda && (

                  <button

                    type="button"

                    className="
                      estudiantes-limpiar
                    "

                    onClick={
                      limpiarBusqueda
                    }

                    aria-label="
                      Limpiar búsqueda
                    "
                  >

                    ×

                  </button>
                )
              }

            </div>


            <label
              className="
                estudiantes-filtro-select
              "
            >

              <span>
                Filtrar por estado
              </span>


              <select

                value={estado}

                onChange={
                  (evento) =>
                    setEstado(
                      evento.target.value
                    )
                }
              >

                <option value="TODOS">
                  Todos
                </option>

                <option value="ACTIVO">
                  Activo
                </option>

                <option value="INACTIVO">
                  Inactivo
                </option>

              </select>

            </label>


            <label
              className="
                estudiantes-filtro-select
              "
            >

              <span>
                Filtrar por carrera
              </span>


              <select

                value={carrera}

                onChange={
                  (evento) =>
                    setCarrera(
                      evento.target.value
                    )
                }
              >

                <option value="">
                  Todas
                </option>


                {
                  carreras.map(
                    (nombreCarrera) => (

                      <option

                        value={
                          nombreCarrera
                        }

                        key={
                          nombreCarrera
                        }
                      >

                        {nombreCarrera}

                      </option>
                    )
                  )
                }

              </select>

            </label>


            <button

              type="submit"

              className="
                estudiantes-boton-buscar
              "
            >

              <IconoBuscar />

              Buscar

            </button>

          </form>


          <section
            className="
              estudiantes-panel-resultados
            "
          >

            {
              cargando
              ? (

                <div
                  className="
                    estudiantes-estado-vacio
                  "
                >

                  <div
                    className="
                      estudiantes-cargando
                    "
                  />


                  <h2>
                    Consultando
                    estudiantes
                  </h2>


                  <p>
                    Espera un momento
                    mientras recuperamos
                    la información.
                  </p>

                </div>

              )
              : datos.estudiantes.length
                === 0
              ? (

                <div
                  className="
                    estudiantes-estado-vacio
                  "
                >

                  <div
                    className="
                      estudiantes-vacio-icono
                    "
                  >
                    <IconoBuscar />
                  </div>


                  <h2>
                    No se encontraron
                    resultados
                  </h2>


                  <p>

                    No existen estudiantes
                    que coincidan con los
                    criterios de búsqueda.

                    <br />

                    Intenta con otros
                    términos o verifica
                    la información
                    ingresada.

                  </p>

                </div>

              )
              : (

                <>

                  <h2>

                    Resultados de
                    búsqueda ({datos.total})

                  </h2>


                  <div
                    className="
                      estudiantes-tabla-contenedor
                    "
                  >

                    <table
                      className="
                        estudiantes-tabla
                      "
                    >

                      <thead>

                        <tr>

                          <th>
                            Código universitario
                          </th>

                          <th>
                            Documento
                          </th>

                          <th>
                            Nombres
                          </th>

                          <th>
                            Apellidos
                          </th>

                          <th>
                            Carrera
                          </th>

                          <th>
                            Estado
                          </th>

                          <th>
                            Acciones
                          </th>

                        </tr>

                      </thead>


                      <tbody>

                        {
                          datos.estudiantes.map(
                            (estudiante) => (

                              <tr
                                key={
                                  estudiante.idUsuario
                                }
                              >

                                <td>
                                  {
                                    estudiante
                                      .codigoUniversitario
                                    || "—"
                                  }
                                </td>

                                <td>
                                  {
                                    estudiante.documento
                                    || "—"
                                  }
                                </td>

                                <td>
                                  {
                                    estudiante.nombres
                                  }
                                </td>

                                <td>
                                  {
                                    estudiante.apellidos
                                  }
                                </td>

                                <td>
                                  {
                                    estudiante.carrera
                                    || "—"
                                  }
                                </td>


                                <td>

                                  <span
                                    className={
                                      `estudiantes-estado ${
                                        estudiante.activo
                                          ? "estudiantes-estado-activo"
                                          : "estudiantes-estado-inactivo"
                                      }`
                                    }
                                  >

                                    {
                                      estudiante.activo
                                        ? "Activo"
                                        : "Inactivo"
                                    }

                                  </span>

                                </td>


                                <td>

                                  <button

                                    type="button"

                                    className="
                                      estudiantes-boton-ver
                                    "

                                    onClick={
                                      () =>
                                        navigate(
                                          `/estudiantes/${estudiante.idUsuario}`
                                        )
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


                  <div
                    className="
                      estudiantes-paginacion-fila
                    "
                  >

                    <span>

                      Mostrando{" "}

                      {desde}

                      {" "}a{" "}

                      {hasta}

                      {" "}de{" "}

                      {datos.total}

                      {" "}estudiantes

                    </span>


                    <div
                      className="
                        estudiantes-paginacion
                      "
                    >

                      <button

                        type="button"

                        onClick={
                          () =>
                            setPagina(
                              (valor) =>
                                Math.max(
                                  0,
                                  valor - 1
                                )
                            )
                        }

                        disabled={
                          pagina === 0
                        }

                        aria-label="
                          Página anterior
                        "
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
                            setPagina(
                              (valor) =>
                                valor + 1
                            )
                        }

                        disabled={
                          pagina + 1
                          >=
                          datos.totalPaginas
                        }

                        aria-label="
                          Página siguiente
                        "
                      >
                        ›
                      </button>

                    </div>

                  </div>

                </>
              )
            }

          </section>

        </main>


        <footer
          className="inicio-footer"
        >

          <span>
            Sistema de Control de
            Ingreso a Exámenes Masivos
          </span>

          <span>
            © 2026. Todos los derechos
            reservados.
          </span>

        </footer>

      </div>

    </div>
  );
}

export default Estudiantes;