import {
  useEffect,
  useState
} from "react";

import {
  useNavigate,
  useParams
} from "react-router-dom";

import Navbar
  from "../../components/Navbar/Navbar";

import Sidebar
  from "../../components/Sidebar/Sidebar";

import {
  obtenerEstudiante
} from "../../services/estudianteService";

import "./Estudiantes.css";


function formatearFecha(fecha) {

  if (!fecha) {
    return "No registrado";
  }

  return new Intl.DateTimeFormat(
    "es-BO"
  ).format(
    new Date(fecha)
  );
}


function Valor({
  etiqueta,
  children
}) {

  return (

    <div
      className="
        estudiante-detalle-campo
      "
    >

      <strong>
        {etiqueta}
      </strong>

      <span>
        {children || "No registrado"}
      </span>

    </div>
  );
}


function DetalleEstudiante() {

  const {
    idUsuario
  } = useParams();

  const navigate =
    useNavigate();

  const [
    estudiante,
    setEstudiante
  ] = useState(null);

  const [
    cargando,
    setCargando
  ] = useState(true);

  const [
    error,
    setError
  ] = useState("");


  useEffect(() => {

    setCargando(true);

    obtenerEstudiante(idUsuario)

      .then((respuesta) => {

        setEstudiante(
          respuesta
        );

        setError("");

      })

      .catch((excepcion) => {

        setEstudiante(null);

        setError(
          excepcion.message
        );

      })

      .finally(
        () =>
          setCargando(false)
      );

  }, [idUsuario]);


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
          className="
            estudiantes-contenido
            detalle-contenido
          "
        >

          <button

            type="button"

            className="detalle-volver"

            onClick={
              () =>
                navigate(
                  "/estudiantes"
                )
            }
          >

            ← Volver a resultados

          </button>


          <header
            className="
              estudiantes-encabezado
              detalle-encabezado
            "
          >

            <h1>
              Información del estudiante
            </h1>

            <p>
              Visualiza la información
              detallada del estudiante
              seleccionado.
            </p>

          </header>


          {
            cargando && (

              <section
                className="
                  estudiantes-panel-resultados
                "
              >

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
                    Consultando estudiante
                  </h2>

                </div>

              </section>
            )
          }


          {
            !cargando &&
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
                    Estudiante no encontrado
                  </strong>

                  <p>
                    {error}
                  </p>

                </div>

              </div>
            )
          }


          {
            !cargando &&
            estudiante && (

              <section
                className="
                  estudiante-detalle-tarjeta
                "
              >

                <div
                  className="
                    estudiante-detalle-resumen
                  "
                >

                  <div
                    className="
                      estudiante-avatar
                    "
                  >

                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >

                      <circle
                        cx="12"
                        cy="8"
                        r="4"
                      />

                      <path
                        d="
                          M4 21
                          c0-4 3.6-7 8-7
                          s8 3 8 7
                        "
                      />

                    </svg>

                  </div>


                  <div
                    className="
                      estudiante-resumen-texto
                    "
                  >

                    <h2>

                      {estudiante.nombres}
                      {" "}
                      {estudiante.apellidos}

                    </h2>


                    <p>

                      Código universitario:
                      {" "}

                      {
                        estudiante
                          .codigoUniversitario
                        ||
                        "No registrado"
                      }


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

                    </p>

                  </div>


                  <button

                    type="button"

                    className="
                      detalle-editar
                    "

                    aria-disabled="true"

                    title="
                      La modificación
                      corresponde a la HU07
                    "
                  >

                    ✎ Editar información

                  </button>

                </div>


                <div
                  className="
                    estudiante-tabs
                  "
                >

                  <button
                    type="button"
                    className="
                      estudiante-tab
                      activo
                    "
                  >
                    Información general
                  </button>


                  <button
                    type="button"
                    className="
                      estudiante-tab
                    "
                    disabled
                  >
                    Información académica
                  </button>


                  <button
                    type="button"
                    className="
                      estudiante-tab
                    "
                    disabled
                  >
                    Historial de ingreso
                  </button>

                </div>


                <div
                  className="
                    estudiante-detalle-grid
                  "
                >

                  <div
                    className="
                      estudiante-detalle-columna
                    "
                  >

                    <Valor
                      etiqueta="
                        Código universitario
                      "
                    >
                      {
                        estudiante
                          .codigoUniversitario
                      }
                    </Valor>


                    <Valor
                      etiqueta="
                        Documento de identidad
                      "
                    >
                      {
                        estudiante.documento
                      }
                    </Valor>


                    <Valor
                      etiqueta="Nombres"
                    >
                      {
                        estudiante.nombres
                      }
                    </Valor>


                    <Valor
                      etiqueta="Apellidos"
                    >
                      {
                        estudiante.apellidos
                      }
                    </Valor>


                    <Valor
                      etiqueta="
                        Fecha de nacimiento
                      "
                    >
                      No registrado
                    </Valor>

                  </div>


                  <div
                    className="
                      estudiante-detalle-columna
                    "
                  >

                    <Valor
                      etiqueta="
                        Correo electrónico
                      "
                    >
                      {
                        estudiante
                          .correoElectronico
                      }
                    </Valor>


                    <Valor
                      etiqueta="Teléfono"
                    >
                      {
                        estudiante.telefono
                      }
                    </Valor>


                    <Valor
                      etiqueta="Dirección"
                    >
                      No registrado
                    </Valor>


                    <Valor
                      etiqueta="Estado"
                    >
                      {
                        estudiante.activo
                          ? "Activo"
                          : "Inactivo"
                      }
                    </Valor>


                    <Valor
                      etiqueta="
                        Fecha de registro
                      "
                    >

                      {
                        formatearFecha(
                          estudiante
                            .fechaRegistro
                        )
                      }

                    </Valor>

                  </div>


                  <div
                    className="
                      estudiante-detalle-columna
                    "
                  >

                    <Valor
                      etiqueta="Carrera"
                    >
                      {
                        estudiante.carrera
                      }
                    </Valor>


                    <Valor
                      etiqueta="Facultad"
                    >
                      No registrado
                    </Valor>


                    <Valor
                      etiqueta="Sede"
                    >
                      No registrado
                    </Valor>


                    <Valor
                      etiqueta="Observaciones"
                    >
                      Sin observaciones
                      registradas
                    </Valor>

                  </div>

                </div>

              </section>
            )
          }

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

export default DetalleEstudiante;