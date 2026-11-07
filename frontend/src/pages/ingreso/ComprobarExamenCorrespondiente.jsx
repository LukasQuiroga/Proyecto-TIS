import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  comprobarCorrespondencia,
  obtenerExamenesIdentificacionDocumento,
} from "../../services/validacionHabilitacionService";

import "./ValidarHabilitacion.css";
import ResultadoHabilitacion from "./ResultadoHabilitacion";

function ComprobarExamenCorrespondiente() {
  const location = useLocation();
  const navigate = useNavigate();

  const identificadoPorCodigo =
    location.state?.origenIdentificacion === "CODIGO";

  const rutaIdentificacion = identificadoPorCodigo
    ? "/ingreso/identificar-codigo"
    : "/ingreso/identificar-documento";

  const estudiante = location.state?.identificacionEstudiante;
  const idEstudiante = Number(estudiante?.idEstudiante);

  const identificacionValida =
    Number.isSafeInteger(idEstudiante) &&
    idEstudiante > 0 &&
    (identificadoPorCodigo
      ? Boolean(estudiante?.codigoUniversitario)
      : Boolean(estudiante?.documentoIdentidad));

  const [examenes, setExamenes] = useState([]);
  const [idExamen, setIdExamen] = useState("");

  const [cargandoExamenes, setCargandoExamenes] =
    useState(identificacionValida);

  const [cargando, setCargando] = useState(false);
  const [errorExamenes, setErrorExamenes] = useState("");
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState(null);
  const [mostrarHabilitacion, setMostrarHabilitacion] = useState(false);

  const solicitudActual = useRef(0);

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

  const cambiarExamen = (valor) => {
    solicitudActual.current += 1;

    setIdExamen(valor);
    setResultado(null);
    setMostrarHabilitacion(false);
    setError("");
    setCargando(false);
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

  const correspondenciaConfirmada =
    resultado?.corresponde === true &&
    resultado?.puedeContinuar === true &&
    Number(resultado?.idExamen) === Number(idExamen) &&
    Number(resultado?.idEstudiante) === idEstudiante;

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

        <p>
          <strong>Nombre:</strong> {estudiante.nombreEstudiante}
        </p>

        <p>
          <strong>Documento:</strong>{" "}
          {estudiante.documentoIdentidad || "No registrado"}
        </p>

        {estudiante.codigoUniversitario && (
          <p>
            <strong>Código SIS:</strong>{" "}
            {estudiante.codigoUniversitario}
          </p>
        )}

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
            <label htmlFor="correspondencia-examen">
              Examen
            </label>

            <select
              id="correspondencia-examen"
              value={idExamen}
              onChange={(evento) =>
                cambiarExamen(evento.target.value)
              }
              disabled={
                cargandoExamenes ||
                Boolean(errorExamenes)
              }
              required
            >
              <option value="">
                {cargandoExamenes
                  ? "Cargando exámenes..."
                  : "Seleccione un examen"}
              </option>

              {examenes.map((examen) => (
                <option
                  key={examen.idExamen}
                  value={examen.idExamen}
                >
                  {examen.codigo ||
                    `Examen ${examen.idExamen}`}{" "}
                  — {examen.nombreExamen}
                </option>
              ))}
            </select>
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

          <div className="validacion-detalles">
            <p>
              <strong>Estudiante:</strong>{" "}
              {estudiante.nombreEstudiante}
            </p>

            <p>
              <strong>Examen:</strong>{" "}
              {examenSeleccionado?.nombreExamen ||
                resultado.idExamen}
            </p>
          </div>

          <p>{resultado.mensaje}</p>

          <div className="validacion-decision">
            {correspondenciaConfirmada
              ? "El estudiante corresponde al examen seleccionado. Puede continuar con la validación de habilitación."
              : "El estudiante no corresponde al examen seleccionado. No puede continuar."}
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
