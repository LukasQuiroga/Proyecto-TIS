import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  comprobarCorrespondencia,
  obtenerExamenesIdentificacionDocumento,
  obtenerFotoEstudiantePorCodigo,
  obtenerFotoEstudiantePorDocumento,
  obtenerFotoEstudianteIdentificado,
} from "../../services/validacionHabilitacionService";
import { FiUser } from "react-icons/fi";
import "./IdentificarDocumento.css";
import "./ValidarHabilitacion.css";
import ResultadoHabilitacion from "./ResultadoHabilitacion";
import "./SelectorExamen.css";

function ComprobarExamenCorrespondiente() {
  const location = useLocation();
  const navigate = useNavigate();

  const origenIdentificacion = location.state?.origenIdentificacion;

  const identificadoPorCodigo = origenIdentificacion === "CODIGO";
  const identificadoPorQr = origenIdentificacion === "QR";

  const rutaIdentificacion = identificadoPorQr
    ? "/ingreso/identificar-qr"
    : identificadoPorCodigo
      ? "/ingreso/identificar-codigo"
      : "/ingreso/identificar-documento";

  const estudiante = location.state?.identificacionEstudiante;
  const idEstudiante = Number(estudiante?.idEstudiante);
  const [fotoUrl, setFotoUrl] = useState(null);
  const [cargandoFoto, setCargandoFoto] = useState(false);

  const identificacionValida =
    Number.isSafeInteger(idEstudiante) &&
    idEstudiante > 0 &&
    Boolean(estudiante?.nombreEstudiante) &&
    (identificadoPorQr ||
      (identificadoPorCodigo
        ? Boolean(estudiante?.codigoUniversitario)
        : Boolean(estudiante?.documentoIdentidad)));

  const [examenes, setExamenes] = useState([]);
  const [idExamen, setIdExamen] = useState(() => {
    const examenInicial = Number(location.state?.idExamenInicial);

    return identificadoPorQr &&
      Number.isSafeInteger(examenInicial) &&
      examenInicial > 0
      ? String(examenInicial)
      : "";
  });

  const [cargandoExamenes, setCargandoExamenes] =
    useState(identificacionValida);

  const [cargando, setCargando] = useState(false);
  const [errorExamenes, setErrorExamenes] = useState("");
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState(null);
  const [mostrarHabilitacion, setMostrarHabilitacion] = useState(false);

  const solicitudActual = useRef(0);
  const [selectorAbierto, setSelectorAbierto] = useState(false);
  const [busquedaExamen, setBusquedaExamen] = useState("");
  const [indiceActivo, setIndiceActivo] = useState(0);

  const selectorRef = useRef(null);
  const botonSelectorRef = useRef(null);
  const buscadorRef = useRef(null);
  const listaExamenesRef = useRef(null);

  useEffect(() => {
    if (!identificacionValida) return;

    let activo = true;

    obtenerExamenesIdentificacionDocumento()
      .then((datos) => {
        if (activo) {
          setExamenes(Array.isArray(datos) ? datos : []);
        }
      })
      .catch((err) => {
        if (activo) {
          setErrorExamenes(
            err.response?.data?.mensaje ||
              err.response?.data?.message ||
              "No se pudieron cargar los exámenes disponibles."
          );
        }
      })
      .finally(() => {
        if (activo) {
          setCargandoExamenes(false);
        }
      });

    return () => {
      activo = false;
      solicitudActual.current += 1;
    };
  }, [identificacionValida]);

  useEffect(() => {
    let activo = true;
    let urlCreada = null;

    const cargarFotografia = async () => {
      if (!identificacionValida) {
        return;
      }

      setCargandoFoto(true);
      setFotoUrl(null);

      try {
        let imagen;

        if (identificadoPorQr) {
          const examenInicial = Number(location.state?.idExamenInicial);

          if (!Number.isSafeInteger(examenInicial) || examenInicial <= 0) {
            return;
          }

          imagen = await obtenerFotoEstudianteIdentificado(
            examenInicial,
            idEstudiante,
          );
        } else if (identificadoPorCodigo) {
          const codigo = estudiante?.codigoUniversitario;

          if (!codigo) {
            return;
          }

          imagen = await obtenerFotoEstudiantePorCodigo(
            idEstudiante,
            codigo,
          );
        } else {
          const documento = estudiante?.documentoIdentidad;

          if (!documento) {
            return;
          }

          imagen = await obtenerFotoEstudiantePorDocumento(
            idEstudiante,
            documento,
          );
        }

        if (!activo) {
          return;
        }

        if (!(imagen instanceof Blob) || !imagen.type.startsWith("image/")) {
          return;
        }

        urlCreada = URL.createObjectURL(imagen);
        setFotoUrl(urlCreada);
      } catch {
        if (activo) {
          setFotoUrl(null);
        }
      } finally {
        if (activo) {
          setCargandoFoto(false);
        }
      }
    };

    void cargarFotografia();

    return () => {
      activo = false;

      if (urlCreada) {
        URL.revokeObjectURL(urlCreada);
      }
    };
  }, [
    identificacionValida,
    idEstudiante,
    identificadoPorCodigo,
    identificadoPorQr,
    estudiante?.codigoUniversitario,
    estudiante?.documentoIdentidad,
    location.state?.idExamenInicial,
  ]);

  const cambiarExamen = (valor) => {
    solicitudActual.current += 1;

    setIdExamen(valor);
    setResultado(null);
    setMostrarHabilitacion(false);
    setError("");
    setCargando(false);
  };

  const seleccionarExamen = (valor) => {
    cambiarExamen(String(valor));
    setSelectorAbierto(false);
    setBusquedaExamen("");
    setIndiceActivo(0);
  };

  const alternarSelector = () => {
    setBusquedaExamen("");
    setIndiceActivo(0);
    setSelectorAbierto((abierto) => !abierto);
  };

  const comprobar = async (evento) => {
    evento.preventDefault();

    if (!identificacionValida || cargando) return;

    if (!idExamen) {
      setError("Debe seleccionar un examen para comprobar la correspondencia.");
      return;
    }

    const examenConsultado = Number(idExamen);
    const solicitud = ++solicitudActual.current;

    setResultado(null);
    setMostrarHabilitacion(false);
    setError("");
    setCargando(true);

    try {
      const datos = await comprobarCorrespondencia(
        examenConsultado,
        idEstudiante
      );

      if (solicitud !== solicitudActual.current) return;

      if (
        Number(datos?.idExamen) !== examenConsultado ||
        Number(datos?.idEstudiante) !== idEstudiante ||
        typeof datos?.corresponde !== "boolean" ||
        typeof datos?.puedeContinuar !== "boolean" ||
        datos.corresponde !== datos.puedeContinuar
      ) {
        setError(
          "El servidor devolvió una comprobación incompleta o inconsistente."
        );
        return;
      }

      setResultado(datos);
    } catch (err) {
      if (solicitud !== solicitudActual.current) return;

      setError(
        err.response?.data?.mensaje ||
          err.response?.data?.message ||
          "No se pudo completar la comprobación de correspondencia."
      );
    } finally {
      if (solicitud === solicitudActual.current) {
        setCargando(false);
      }
    }
  };

  const examenSeleccionado = examenes.find(
    (examen) => String(examen.idExamen) === idExamen
  );

  const normalizarTexto = (texto) =>
    String(texto ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const examenesFiltrados = examenes.filter((examen) => {
    const texto = `${examen.codigo || ""} ${examen.nombreExamen || ""}`;

    return normalizarTexto(texto).includes(normalizarTexto(busquedaExamen));
  });

  const manejarTecladoSelector = (evento) => {
    if (evento.key === "ArrowDown") {
      evento.preventDefault();

      setIndiceActivo((actual) =>
        Math.min(actual + 1, Math.max(0, examenesFiltrados.length - 1)),
      );
    } else if (evento.key === "ArrowUp") {
      evento.preventDefault();

      setIndiceActivo((actual) => Math.max(0, actual - 1));
    } else if (evento.key === "Enter") {
      evento.preventDefault();

      const examen = examenesFiltrados[indiceActivo];

      if (examen) {
        seleccionarExamen(examen.idExamen);
      }
    } else if (evento.key === "Escape") {
      evento.preventDefault();
      setSelectorAbierto(false);
      botonSelectorRef.current?.focus();
    }
  };

  const correspondenciaConfirmada =
    resultado?.corresponde === true &&
    resultado?.puedeContinuar === true &&
    Number(resultado?.idExamen) === Number(idExamen) &&
    Number(resultado?.idEstudiante) === idEstudiante;

  useEffect(() => {
    if (!selectorAbierto) {
      return;
    }

    buscadorRef.current?.focus();

    const cerrarAlSalir = (evento) => {
      if (
        selectorRef.current &&
        !selectorRef.current.contains(evento.target)
      ) {
        setSelectorAbierto(false);
      }
    };

    document.addEventListener("pointerdown", cerrarAlSalir);
    document.addEventListener("focusin", cerrarAlSalir);

    return () => {
      document.removeEventListener("pointerdown", cerrarAlSalir);
      document.removeEventListener("focusin", cerrarAlSalir);
    };
  }, [selectorAbierto]);

  useEffect(() => {
    if (!selectorAbierto) return;

    const lista = listaExamenesRef.current;
    const opcionActiva = lista?.querySelector('[data-activo="true"]');

    if (!lista || !opcionActiva) return;

    const rectLista = lista.getBoundingClientRect();
    const rectOpcion = opcionActiva.getBoundingClientRect();

    if (rectOpcion.top < rectLista.top) {
      lista.scrollTop -= rectLista.top - rectOpcion.top;
    } else if (rectOpcion.bottom > rectLista.bottom) {
      lista.scrollTop += rectOpcion.bottom - rectLista.bottom;
    }
  }, [selectorAbierto, indiceActivo, busquedaExamen]);

  if (!identificacionValida) {
    return (
      <main className="validacion-pagina">
        <header className="validacion-encabezado">
          <h1>Comprobar examen correspondiente</h1>
        </header>

        <section
          className="validacion-resultado validacion-error"
          role="alert"
        >
          <h2>No hay un estudiante identificado</h2>
          <p>
            Primero debe identificar correctamente a un estudiante
            para comprobar su correspondencia con un examen.
          </p>

          <button
            type="button"
            className="validacion-boton"
            onClick={() => navigate(rutaIdentificacion)}
          >
            Identificar estudiante
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="validacion-pagina">
      <header className="validacion-encabezado">
        <h1>Comprobar examen correspondiente</h1>
        <p>
          Seleccione un examen para comprobar si el estudiante
          identificado está inscrito en él.
        </p>
      </header>

      <section className="validacion-panel">
        <h2>Estudiante identificado</h2>

        <div className="identificacion-perfil-contenido">
          <div className="identificacion-fotografia">
            {fotoUrl ? (
              <img
                src={fotoUrl}
                alt={`Fotografía de ${estudiante.nombreEstudiante}`}
              />
            ) : (
              <FiUser aria-hidden="true" />
            )}

            {cargandoFoto && (
              <span className="identificacion-foto-cargando">
                Cargando fotografía...
              </span>
            )}
          </div>

          <dl className="identificacion-perfil-datos">
            <div className="identificacion-detalle">
              <dt>Nombre:</dt>
              <dd>{estudiante.nombreEstudiante}</dd>
            </div>

            <div className="identificacion-detalle">
              <dt>Documento:</dt>
              <dd>{estudiante.documentoIdentidad || "No registrado"}</dd>
            </div>

            <div className="identificacion-detalle">
              <dt>Código SIS:</dt>
              <dd>{estudiante.codigoUniversitario || "No registrado"}</dd>
            </div>
          </dl>
        </div>

        <button
          type="button"
          className="validacion-boton"
          onClick={() => navigate(rutaIdentificacion)}
        >
          Buscar otro estudiante
        </button>
      </section>

      <section className="validacion-panel">
        <h2>Datos de la comprobación</h2>

        <form
          className="validacion-formulario"
          onSubmit={comprobar}
        >
          <div className="validacion-campo">
            <label htmlFor="correspondencia-examen">Examen</label>

            <div className="selector-examen" ref={selectorRef}>
              <button
                ref={botonSelectorRef}
                id="correspondencia-examen"
                type="button"
                className="selector-examen-boton"
                onClick={alternarSelector}
                aria-haspopup="listbox"
                aria-expanded={selectorAbierto}
                aria-controls="lista-examenes"
                disabled={cargandoExamenes || Boolean(errorExamenes)}
              >
                <span>
                  {examenSeleccionado
                    ? `${examenSeleccionado.codigo || `Examen ${examenSeleccionado.idExamen}`} — ${examenSeleccionado.nombreExamen}`
                    : cargandoExamenes
                      ? "Cargando exámenes..."
                      : "Seleccione un examen"}
                </span>

                <span className="selector-examen-flecha" aria-hidden="true">
                  {selectorAbierto ? "▲" : "▼"}
                </span>
              </button>

              {selectorAbierto && (
                <div className="selector-examen-desplegable">
                  <input
                    ref={buscadorRef}
                    type="text"
                    className="selector-examen-busqueda"
                    placeholder="Buscar por código o nombre..."
                    aria-label="Buscar examen por código o nombre"
                    role="combobox"
                    aria-expanded="true"
                    aria-controls="lista-examenes"
                    aria-activedescendant={
                      examenesFiltrados[indiceActivo]
                        ? `opcion-examen-${indiceActivo}`
                        : undefined
                    }
                    value={busquedaExamen}
                    onChange={(evento) => {
                      setBusquedaExamen(evento.target.value);
                      setIndiceActivo(0);
                    }}
                    onKeyDown={manejarTecladoSelector}
                  />

                  <div
                    ref={listaExamenesRef}
                    id="lista-examenes"
                    className="selector-examen-lista"
                    role="listbox"
                    aria-label="Exámenes disponibles"
                  >
                    {examenesFiltrados.length === 0 ? (
                      <p className="selector-examen-vacio">
                        No se encontraron exámenes.
                      </p>
                    ) : (
                      examenesFiltrados.map((examen, indice) => (
                        <button
                          key={examen.idExamen}
                          id={`opcion-examen-${indice}`}
                          type="button"
                          role="option"
                          aria-selected={String(examen.idExamen) === idExamen}
                          data-activo={indice === indiceActivo}
                          className={`selector-examen-opcion ${
                            String(examen.idExamen) === idExamen
                              ? "selector-examen-seleccionado"
                              : ""
                          } ${
                            indice === indiceActivo ? "selector-examen-activo" : ""
                          }`}
                          onClick={() => seleccionarExamen(examen.idExamen)}
                        >
                          <span className="selector-examen-codigo">
                            {examen.codigo || `Examen ${examen.idExamen}`}
                          </span>

                          <span>{examen.nombreExamen}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {examenSeleccionado && (
            <div className="validacion-info-examen">
              <p>
                <strong>Asignatura y grupo:</strong>{" "}
                {examenSeleccionado.materia}
              </p>
              <p>
                <strong>Estado del examen:</strong>{" "}
                {examenSeleccionado.estado ||
                  "No especificado"}
              </p>
            </div>
          )}

          <button
            type="submit"
            className="validacion-boton"
            disabled={
              cargando ||
              cargandoExamenes ||
              !idExamen ||
              Boolean(errorExamenes)
            }
          >
            {cargando
              ? "Comprobando..."
              : "Comprobar correspondencia"}
          </button>
        </form>
      </section>

      {errorExamenes && (
        <section
          className="validacion-resultado validacion-error"
          role="alert"
        >
          <h2>No se pudieron cargar los exámenes</h2>
          <p>{errorExamenes}</p>
        </section>
      )}

      {error && (
        <section
          className="validacion-resultado validacion-error"
          role="alert"
        >
          <h2>Comprobación no completada</h2>
          <p>{error}</p>
        </section>
      )}

      {resultado && (
        <section
          className={`validacion-resultado ${
            correspondenciaConfirmada
              ? "validacion-habilitado"
              : "validacion-bloqueado"
          }`}
          aria-live="polite"
        >
          <h2>
            {correspondenciaConfirmada
              ? "Correspondencia confirmada"
              : "Correspondencia no confirmada"}
          </h2>

          <div className="validacion-decision">
            {correspondenciaConfirmada
              ? "El estudiante está inscrito en el examen seleccionado. Puede continuar con la validación de habilitación."
              : "El estudiante no está inscrito en el examen seleccionado. No puede continuar con la validación de habilitación."}
          </div>

          {correspondenciaConfirmada && !mostrarHabilitacion && (
            <button
              type="button"
              className="validacion-boton"
              onClick={() => setMostrarHabilitacion(true)}
            >
              Continuar validación
            </button>
          )}
        </section>
      )}

      {correspondenciaConfirmada &&
        mostrarHabilitacion &&
        examenSeleccionado && (
          <div className="validacion-integrada">
            <ResultadoHabilitacion
              key={`${idExamen}-${idEstudiante}`}
              idExamen={Number(idExamen)}
              idEstudiante={idEstudiante}
              nombreExamen={examenSeleccionado.nombreExamen}
              nombreEstudiante={estudiante.nombreEstudiante}
              codigoEstudiante={
                estudiante.codigoUniversitario || ""
              }
            />
          </div>
        )}
    </main>
  );
}

export default ComprobarExamenCorrespondiente;
