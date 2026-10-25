import { useEffect, useRef, useState } from "react";
import {
  obtenerExamenesIngreso,
  obtenerEstudiantesIngreso,
  consultarHabilitacion
} from "../../services/validacionHabilitacionService";
import "./ValidarHabilitacion.css";

function ValidarHabilitacion() {
  const [examenes, setExamenes] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [idExamen, setIdExamen] = useState("");
  const [idEstudiante, setIdEstudiante] = useState("");
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [cargandoExamenes, setCargandoExamenes] = useState(true);
  const [cargandoEstudiantes, setCargandoEstudiantes] = useState(false);

  const solicitudActual = useRef(0);
  const cargaEstudiantesActual = useRef(0);

  useEffect(() => {
    let activo = true;

    obtenerExamenesIngreso()
      .then((datos) => {
        if (activo) setExamenes(datos);
      })
      .catch(() => {
        if (activo) {
          setError("No se pudo cargar la lista de exámenes.");
        }
      })
      .finally(() => {
        if (activo) setCargandoExamenes(false);
      });

    return () => {
      activo = false;
      solicitudActual.current += 1;
      cargaEstudiantesActual.current += 1;
    };
  }, []);

  const limpiarResultado = () => {
    solicitudActual.current += 1;
    setResultado(null);
    setError("");
    setCargando(false);
  };

  const cambiarExamen = async (valor) => {
    const solicitud = ++cargaEstudiantesActual.current;

    setIdExamen(valor);
    setIdEstudiante("");
    setEstudiantes([]);
    limpiarResultado();

    if (!valor) {
      setCargandoEstudiantes(false);
      return;
    }

    setCargandoEstudiantes(true);

    try {
      const datos = await obtenerEstudiantesIngreso(valor);

      if (solicitud !== cargaEstudiantesActual.current) return;

      setEstudiantes(datos);
    } catch {
      if (solicitud !== cargaEstudiantesActual.current) return;

      setError("No se pudieron cargar los estudiantes del examen.");
    } finally {
      if (solicitud === cargaEstudiantesActual.current) {
        setCargandoEstudiantes(false);
      }
    }
  };

  const cambiarEstudiante = (valor) => {
    setIdEstudiante(valor);
    limpiarResultado();
  };

  const validar = async (evento) => {
    evento.preventDefault();

    limpiarResultado();

    if (!idExamen || !idEstudiante) {
      setError("Seleccione un examen y un estudiante.");
      return;
    }

    const solicitud = ++solicitudActual.current;
    setCargando(true);

    try {
      const datos = await consultarHabilitacion(
        Number(idExamen),
        Number(idEstudiante)
      );

      if (solicitud !== solicitudActual.current) return;

      setResultado(datos);
    } catch (err) {
      if (solicitud !== solicitudActual.current) return;

      setError(
        err.response?.data?.mensaje ||
        err.response?.data?.message ||
        "No se pudo completar la validación. Verifique la conexión."
      );
    } finally {
      if (solicitud === solicitudActual.current) {
        setCargando(false);
      }
    }
  };

  const habilitado =
    resultado?.estado === "HABILITADO" &&
    resultado?.puedeContinuar === true;

  const examenSeleccionado = examenes.find(
        (examen) => String(examen.idExamen) === String(idExamen)
    );

    const resumirTexto = (texto, limite = 45) => {
    if (!texto) return "";

    const valor = String(texto).trim();

    return valor.length > limite
        ? `${valor.slice(0, limite).trimEnd()}...`
        : valor;
  };

  return (
    <main className="validacion-pagina">
      <header className="validacion-encabezado">
        <h1>Validar habilitación</h1>
        <p>
          Seleccione un examen y un estudiante para comprobar
          si puede continuar con el ingreso.
        </p>
      </header>

      <section className="validacion-panel">
        <h2>Datos de la validación</h2>

        <form onSubmit={validar} className="validacion-formulario">
          <div className="validacion-campo">
            <label htmlFor="validacion-examen">Examen</label>

            <select
              id="validacion-examen"
              value={idExamen}
              onChange={(e) => cambiarExamen(e.target.value)}
              disabled={cargandoExamenes}
              required
            >
              <option value="">
                {cargandoExamenes
                  ? "Cargando exámenes..."
                  : "Seleccione un examen"}
              </option>

              {examenes.map((examen) => (
                <option key={examen.idExamen} value={examen.idExamen}>
                    {examen.codigo || `Examen ${examen.idExamen}`}
                    {" — "}
                    {resumirTexto(examen.nombreExamen, 35)}
                </option>
                ))}
            </select>
            {examenSeleccionado && (
                <div className="validacion-info-examen">
                    <div>
                        <strong>Examen:</strong>
                       <span>{examenSeleccionado.nombreExamen}</span>
                    </div>
                    <div>
                        <strong>Asignatura y grupo:</strong>
                        <span>{examenSeleccionado.materia}</span>
                    </div>

                    <div>
                        <strong>Estado del examen:</strong>
                        <span>{examenSeleccionado.estado || "No especificado"}</span>
                    </div>
                </div>
            )}
          </div>

          <div className="validacion-campo">
            <label htmlFor="validacion-estudiante">
              Estudiante inscrito
            </label>

            <select
              id="validacion-estudiante"
              value={idEstudiante}
              onChange={(e) => cambiarEstudiante(e.target.value)}
              disabled={!idExamen || cargandoEstudiantes || estudiantes.length === 0}
              required
            >
            <option value="">
                {cargandoEstudiantes
                    ? "Cargando estudiantes..."
                    : !idExamen
                    ? "Primero seleccione un examen"
                    : estudiantes.length === 0
                        ? "No hay estudiantes inscritos"
                        : "Seleccione un estudiante"}
            </option>

              {estudiantes.map((estudiante) => (
                <option
                    key={estudiante.idEstudiante}
                    value={estudiante.idEstudiante}
                >
                    {estudiante.codigoUniversitario
                    ? `${estudiante.codigoUniversitario} — `
                    : ""}
                    {estudiante.nombreEstudiante}
                </option>
                ))}
            </select>
          </div>

          <button
            type="submit"
            className="validacion-boton"
            disabled={
              cargando ||
              cargandoEstudiantes ||
              !idExamen ||
              !idEstudiante
            }
          >
            {cargando ? "Validando..." : "Validar habilitación"}
          </button>
        </form>
      </section>

      {error && (
        <section className="validacion-resultado validacion-error" role="alert">
          <h2>Validación no completada</h2>
          <p>{error}</p>
          <strong>Ingreso no autorizado.</strong>
        </section>
      )}

      {resultado && (
        <section
          className={`validacion-resultado ${
            habilitado ? "validacion-habilitado" : "validacion-bloqueado"
          }`}
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
              {examenes.find(
                (e) => String(e.idExamen) === String(resultado.idExamen)
              )?.nombreExamen || resultado.idExamen}
            </p>

            <p>
              <strong>Estudiante:</strong>{" "}
              {estudiantes.find(
                (e) => String(e.idEstudiante) === String(resultado.idEstudiante)
              )?.nombreEstudiante || resultado.idEstudiante}
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

export default ValidarHabilitacion;
