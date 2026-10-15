import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiBookOpen, FiRefreshCw, FiInfo } from "react-icons/fi";
import { useAuth } from "../../context/useAuth";
import {
  obtenerMateriasInscritasEstudianteQr,
  obtenerMensajeErrorQr
} from "../../services/inscripcionQrService";
import "./InscripcionQr.css";

function formatearFecha(fecha) {
  if (!fecha) return "No disponible";
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return "No disponible";
  return valor.toLocaleString("es-BO", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function MisMaterias() {
  const { usuario } = useAuth();
  const esEstudiante = usuario?.nombreRol === "ESTUDIANTE";
  const [materias, setMaterias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargarMaterias = useCallback(async (signal) => {
    setCargando(true);
    setError("");
    try {
      const datos = await obtenerMateriasInscritasEstudianteQr();
      if (!signal?.aborted) setMaterias(datos);
    } catch (err) {
      if (!signal?.aborted) {
        setError(obtenerMensajeErrorQr(err, "listar-materias-estudiante"));
      }
    } finally {
      if (!signal?.aborted) setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (!esEstudiante) {
      setCargando(false);
      return;
    }
    const controller = new AbortController();
    cargarMaterias(controller.signal);
    return () => controller.abort();
  }, [esEstudiante, cargarMaterias]);

  return (
    <main className="hu12-pagina">
      <header className="hu12-encabezado">
        <h1>Mis materias inscritas</h1>
        <p>Consulta las materias en las que estás inscrito.</p>
      </header>

      <section className="hu12-tarjeta">
        <div className="hu12-tarjeta-titulo">
          <h2><FiBookOpen /> Materias inscritas</h2>
          <p>Estas inscripciones están asociadas a tu cuenta de estudiante.</p>
        </div>

        {!esEstudiante ? (
          <p className="hu12-error-materias" role="alert">
            <FiInfo /> Solo los estudiantes pueden consultar esta información.
          </p>
        ) : (
          <>
            <div className="hu12-acciones-estudiante">
              <button
                type="button"
                className="hu12-boton-secundario"
                disabled={cargando}
                onClick={() => cargarMaterias()}
              >
                <FiRefreshCw /> {cargando ? "Actualizando..." : "Actualizar"}
              </button>
              <Link className="hu12-boton-principal" to="/inscripcion-qr/inscribir">
                Inscribirme mediante QR
              </Link>
            </div>

            {cargando && <p className="hu12-ayuda" role="status">Cargando materias inscritas...</p>}
            {!cargando && error && (
              <p className="hu12-error-materias" role="alert"><FiInfo /> {error}</p>
            )}
            {!cargando && !error && materias.length === 0 && (
              <p className="hu12-ayuda"><FiInfo /> Todavía no tienes materias inscritas.</p>
            )}
            {!cargando && !error && materias.length > 0 && (
              <div style={{ overflowX: "auto", marginTop: 20 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr>
                      {["Asignatura", "Grupo", "Fecha de inscripción"].map((columna) => (
                        <th key={columna} scope="col" style={{ padding: "12px", borderBottom: "2px solid #dfe7f1" }}>
                          {columna}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {materias.map((materia) => (
                      <tr key={materia.idMateria}>
                        <td style={{ padding: "12px", borderBottom: "1px solid #dfe7f1" }}>
                          {materia.nombreAsignatura || "No disponible"}
                        </td>
                        <td style={{ padding: "12px", borderBottom: "1px solid #dfe7f1" }}>
                          {materia.grupo || "No asignado"}
                        </td>
                        <td style={{ padding: "12px", borderBottom: "1px solid #dfe7f1" }}>
                          {formatearFecha(materia.fechaInscripcion)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default MisMaterias;
