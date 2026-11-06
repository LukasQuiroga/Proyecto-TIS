import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  consultarHabilitacionPorDocumento,
  obtenerExamenesIdentificacionDocumento,
} from "../../services/validacionHabilitacionService";
import "./ValidarHabilitacion.css";

function ValidarEstadoDocumento() {
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
    Boolean(estudiante?.documentoIdentidad);

  const [examenes, setExamenes] = useState([]);
  const [idExamen, setIdExamen] = useState("");
  const [cargandoExamenes, setCargandoExamenes] =
    useState(identificacionValida);
  const [cargando, setCargando] = useState(false);
  const [errorExamenes, setErrorExamenes] = useState("");
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState(null);
  const solicitudActual = useRef(0);

  useEffect(() => {
    if (!identificacionValida) return;

    let activo = true;

    obtenerExamenesIdentificacionDocumento()
      .then((datos) => {
        if (activo) {
          setExamenes(datos);
        }
      })
      .catch((err) => {
        if (activo) {
          setErrorExamenes(
            err.response?.data?.mensaje ||
              err.response?.data?.message ||
              "No se pudieron cargar los exámenes disponibles.",
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
    setError("");
    setCargando(false);
  };

  const validar = async (evento) => {
    evento.preventDefault();

    if (!identificacionValida || cargando) return;

    if (!idExamen) {
      setError("Seleccione un examen para validar al estudiante identificado.");
      return;
    }

    const solicitud = ++solicitudActual.current;
    setResultado(null);
    setError("");
    setCargando(true);

    try {
      const datos = await consultarHabilitacionPorDocumento(
        Number(idExamen),
        idEstudiante,
      );

      if (solicitud !== solicitudActual.current) return;

      const estadosValidos = [
        "HABILITADO",
        "INHABILITADO",
        "SIN_ESTADO",
        "NO_ASOCIADO",
      ];

      if (
        Number(datos?.idExamen) !== Number(idExamen) ||
        Number(datos?.idEstudiante) !== idEstudiante ||
        !estadosValidos.includes(datos?.estado) ||
        typeof datos?.puedeContinuar !== "boolean" ||
        (datos.estado !== "HABILITADO" && datos.puedeContinuar)
      ) {
        setError(
          "El servidor devolvió una validación incompleta o inconsistente.",
        );
        return;
      }

      setResultado(datos);
    } catch (err) {
      if (solicitud !== solicitudActual.current) return;

      setError(
        err.response?.data?.mensaje ||
          err.response?.data?.message ||
          "No se pudo validar la habilitación del estudiante.",
      );
    } finally {
      if (solicitud === solicitudActual.current) {
        setCargando(false);
      }
    }
  };

  const examenSeleccionado = examenes.find(
    (examen) => String(examen.idExamen) === idExamen,
  );
  const habilitado =
    resultado?.estado === "HABILITADO" && resultado?.puedeContinuar === true;

  if (!identificacionValida) {
    return (
      <main className="validacion-pagina">
        <header className="validacion-encabezado">
          <h1>Validar estado</h1>
        </header>
        <section className="validacion-resultado validacion-error" role="alert">
          <h2>No hay un estudiante identificado</h2>
          <p>
              Primero debe identificar correctamente a un estudiante
              para continuar con la validación.
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
        <h1>Validar estado</h1>
        <p>
          Seleccione un examen para comprobar la habilitación del estudiante
          identificado.
        </p>
      </header>

      <section className="validacion-panel">
        <h2>Estudiante identificado</h2>
        <p>
          <strong>Nombre:</strong> {estudiante.nombreEstudiante}
        </p>
        <p>
          <strong>Documento:</strong> {estudiante.documentoIdentidad}
        </p>
        {estudiante.codigoUniversitario && (
          <p>
            <strong>Código SIS:</strong> {estudiante.codigoUniversitario}
          </p>
        )}
        <button
          type="button"
          className="validacion-boton"
          onClick={() => navigate("/ingreso/identificar-documento")}
        >
          Buscar otro estudiante
        </button>
      </section>

      <section className="validacion-panel">
        <h2>Datos de la validación</h2>
        <form className="validacion-formulario" onSubmit={validar}>
          <div className="validacion-campo">
            <label htmlFor="validacion-documento-examen">Examen</label>
            <select
              id="validacion-documento-examen"
              value={idExamen}
              onChange={(evento) => cambiarExamen(evento.target.value)}
              disabled={cargandoExamenes || Boolean(errorExamenes)}
              required
            >
              <option value="">
                {cargandoExamenes
                  ? "Cargando exámenes..."
                  : "Seleccione un examen"}
              </option>
              {examenes.map((examen) => (
                <option key={examen.idExamen} value={examen.idExamen}>
                  {examen.codigo || `Examen ${examen.idExamen}`} —{" "}
                  {examen.nombreExamen}
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
                {examenSeleccionado.estado || "No especificado"}
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
            {cargando ? "Validando..." : "Validar habilitación"}
          </button>
        </form>
      </section>

      {errorExamenes && (
        <section className="validacion-resultado validacion-error" role="alert">
          <h2>No se pudieron cargar los exámenes</h2>
          <p>{errorExamenes}</p>
        </section>
      )}

      {error && (
        <section className="validacion-resultado validacion-error" role="alert">
          <h2>Validación no completada</h2>
          <p>{error}</p>
        </section>
      )}

      {resultado && (
        <section
          className={`validacion-resultado ${habilitado ? "validacion-habilitado" : "validacion-bloqueado"}`}
          aria-live="polite"
        >
          <h2>
            {habilitado
              ? "Estudiante habilitado"
              : resultado.estado === "INHABILITADO"
                ? "Estudiante inhabilitado"
                : "Ingreso no autorizado"}
          </h2>
          <div className="validacion-detalles">
            <p>
              <strong>Examen:</strong>{" "}
              {examenSeleccionado?.nombreExamen || resultado.idExamen}
            </p>
            <p>
              <strong>Estudiante:</strong> {estudiante.nombreEstudiante}
            </p>
            <p>
              <strong>Estado:</strong> {resultado.estado}
            </p>
          </div>
          <p>{resultado.mensaje}</p>
          {resultado.estado === "INHABILITADO" && (
            <div className="validacion-motivo">
              <h3>Motivo de inhabilitación</h3>
              <p>
                <strong>
                  {resultado.tituloMotivo || "Sin título registrado"}
                </strong>
              </p>
              <p>{resultado.motivo || "Sin detalle registrado"}</p>
            </div>
          )}
          <div className="validacion-decision">
            {habilitado
              ? "Habilitación confirmada. Puede continuar con las demás verificaciones."
              : "No se permite continuar con el ingreso."}
          </div>
        </section>
      )}
    </main>
  );
}

export default ValidarEstadoDocumento;
