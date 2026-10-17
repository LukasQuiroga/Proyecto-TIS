import { useEffect, useMemo, useState } from "react";
import {
  actualizarHabilitacionesMasivas,
  consultarHistorialHabilitacion,
  listarMotivos,
  mensajeErrorHabilitacion
} from "../../services/habilitacionService";

export default function HabilitacionesExtras({
  idExamen,
  estudiantes,
  onActualizar
}) {
  const [seleccionados, setSeleccionados] = useState([]);
  const [estado, setEstado] = useState("INHABILITADO");
  const [titulo, setTitulo] = useState("");
  const [motivo, setMotivo] = useState("");
  const [tipoMotivo, setTipoMotivo] = useState("PERSONALIZADO");
  const [idMotivo, setIdMotivo] = useState("");
  const [motivosDisponibles, setMotivosDisponibles] = useState([]);
  const [historialId, setHistorialId] = useState("");
  const [historial, setHistorial] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState(null);

  const estudiantesValidos = useMemo(
    () => estudiantes.filter((e) => e.idEstudiante != null),
    [estudiantes]
  );

  useEffect(() => {
    let activo = true;

    const cargarMotivos = async () => {
      try {
        const datos = await listarMotivos();

        if (activo) {
          setMotivosDisponibles(Array.isArray(datos) ? datos : []);
        }
      } catch (err) {
        if (activo) {
          setError(mensajeErrorHabilitacion(err));
        }
      }
    };

    cargarMotivos();

    return () => {
      activo = false;
    };
  }, []);

  const alternar = (id) => {
    setSeleccionados((actuales) =>
      actuales.includes(id)
        ? actuales.filter((valor) => valor !== id)
        : [...actuales, id]
    );
  };

  const alternarTodos = () => {
    const ids = estudiantesValidos.map((e) => e.idEstudiante);
    setSeleccionados((actuales) =>
      ids.every((id) => actuales.includes(id)) ? [] : ids
    );
  };

  const guardarMasivo = async () => {
    if (!seleccionados.length) {
      setError("Selecciona al menos un estudiante.");
      return;
    }
    if (estado === "INHABILITADO") {
      if (tipoMotivo === "PREDEFINIDO" && !idMotivo) {
        setError("Selecciona un motivo predefinido.");
        return;
      }

      if (
        tipoMotivo === "PERSONALIZADO" &&
        (!titulo.trim() || !motivo.trim())
      ) {
        setError("Escribe el título y el motivo.");
        return;
      }
    }

    setProcesando(true);
    setError("");
    setResultado(null);

    try {
      const cambios = estudiantesValidos
        .filter((e) => seleccionados.includes(e.idEstudiante))
        .map((e) => ({
          idEstudiante: e.idEstudiante,
          estado,
          idMotivo:
            estado === "INHABILITADO" && tipoMotivo === "PREDEFINIDO"
              ? Number(idMotivo)
              : null,
          titulo:
            estado === "INHABILITADO" && tipoMotivo === "PERSONALIZADO"
              ? titulo.trim()
              : null,
          motivo:
            estado === "INHABILITADO" && tipoMotivo === "PERSONALIZADO"
              ? motivo.trim()
              : null,
          numeroCambios: e.numeroCambios ?? 0
        }));

      const respuestas = [];

      for (let i = 0; i < cambios.length; i += 200) {
        respuestas.push(
          await actualizarHabilitacionesMasivas(
            idExamen,
            cambios.slice(i, i + 200)
          )
        );
      }

      const resumen = {
        exitosos: respuestas.reduce((suma, r) => suma + r.exitosos, 0),
        fallidos: respuestas.reduce((suma, r) => suma + r.fallidos, 0),
        resultados: respuestas.flatMap((r) => r.resultados)
      };

      setResultado(resumen);
      setSeleccionados(
        resumen.resultados
          .filter((r) => !r.exitoso)
          .map((r) => r.idEstudiante)
      );
      await onActualizar();
    } catch (err) {
      setError(mensajeErrorHabilitacion(err));
    } finally {
      setProcesando(false);
    }
  };

  const cargarHistorial = async (id) => {
    setHistorialId(id);
    setHistorial([]);
    if (!id) return;

    setCargandoHistorial(true);
    setError("");

    try {
      const datos = await consultarHistorialHabilitacion(idExamen, id);
      setHistorial(Array.isArray(datos) ? datos : []);
    } catch (err) {
      setError(mensajeErrorHabilitacion(err));
    } finally {
      setCargandoHistorial(false);
    }
  };

  return (
    <section className="hab-extras">
      <div className="hab-panel hab-extra-panel">
        <h2>Gestión masiva de habilitaciones</h2>
        <p>Selecciona estudiantes del examen y aplica un mismo cambio.</p>

        <div className="hab-extra-herramientas">
          <button
            type="button"
            className="hab-btn hab-btn-sec"
            onClick={alternarTodos}
            disabled={procesando || !estudiantesValidos.length}
          >
            Seleccionar / deseleccionar todos
          </button>
          <span>{seleccionados.length} seleccionados</span>
        </div>

        <div className="hab-extra-lista">
          {estudiantesValidos.map((e) => (
            <label key={e.idEstudiante} className="hab-extra-estudiante">
              <input
                type="checkbox"
                checked={seleccionados.includes(e.idEstudiante)}
                onChange={() => alternar(e.idEstudiante)}
                disabled={procesando}
              />
              <span>{e.nombreEstudiante}</span>
              <small>{e.estado}</small>
            </label>
          ))}
          {!estudiantesValidos.length && (
            <p>No hay estudiantes para seleccionar.</p>
          )}
        </div>

        <div className="hab-extra-formulario">
          <label>
            Nuevo estado
            <select
              value={estado}
              onChange={(e) => {
                setEstado(e.target.value);
                setTitulo("");
                setMotivo("");
              }}
              disabled={procesando}
            >
              <option value="INHABILITADO">Inhabilitado</option>
              <option value="HABILITADO">Habilitado</option>
            </select>
          </label>

          
          {estado === "INHABILITADO" && (
            <>
              <label>
                Tipo de motivo
                <select
                  value={tipoMotivo}
                  onChange={(e) => {
                    setTipoMotivo(e.target.value);
                    setIdMotivo("");
                    setTitulo("");
                    setMotivo("");
                    setError("");
                  }}
                  disabled={procesando}
                >
                  <option value="PERSONALIZADO">Motivo personalizado</option>
                  <option value="PREDEFINIDO">Motivo predefinido</option>
                </select>
              </label>

              {tipoMotivo === "PREDEFINIDO" && (
                <label>
                  Seleccionar motivo
                  <select
                    value={idMotivo}
                    onChange={(e) => setIdMotivo(e.target.value)}
                    disabled={procesando}
                  >
                    <option value="">Selecciona un motivo</option>
                    {motivosDisponibles.map((item) => (
                      <option key={item.idMotivo} value={item.idMotivo}>
                        {item.titulo}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {tipoMotivo === "PERSONALIZADO" && (
                <>
                  <label>
                    Título de la inhabilitación
                    <input
                      type="text"
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      placeholder="Escribe el título"
                      maxLength={120}
                      disabled={procesando}
                    />
                  </label>
                  <label>
                    Motivo
                    <textarea
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      placeholder="Escribe el motivo"
                      maxLength={500}
                      rows={3}
                      disabled={procesando}
                    />
                  </label>
                </>
              )}
            </>
          )}

          <button
            className="hab-btn hab-btn-pri"
            type="button"
            onClick={guardarMasivo}
            disabled={procesando || !seleccionados.length}
          >
            {procesando ? "Procesando..." : "Guardar cambios masivos"}
          </button>
        </div>


      </div>

      <div className="hab-panel hab-extra-panel">
        <h2>Historial de habilitaciones</h2>
        <p>Consulta las modificaciones anteriores de un estudiante.</p>

        <label className="hab-extra-historial-selector">
          Estudiante
          <select
            value={historialId}
            onChange={(e) => cargarHistorial(e.target.value)}
          >
            <option value="">Selecciona un estudiante</option>
            {estudiantesValidos.map((e) => (
              <option key={e.idEstudiante} value={e.idEstudiante}>
                {e.nombreEstudiante}
              </option>
            ))}
          </select>
        </label>

        {cargandoHistorial ? (
          <p>Cargando historial...</p>
        ) : historialId && !historial.length ? (
          <p>No existen modificaciones registradas.</p>
        ) : (
          <div className="hab-extra-historial">
            {historial.map((registro) => (
              <article key={registro.idLog}>
                <div className="hab-extra-historial-encabezado">
                  <strong>{registro.nombreResponsable}</strong>
                  <time>
                    {new Date(registro.fecha).toLocaleString("es-BO")}
                  </time>
                </div>
                <p>{registro.descripcion}</p>
              </article>
            ))}
          </div>
        )}
      </div>

      {error && <p className="hab-error" role="alert">{error}</p>}

      {resultado && (
        <div className="hab-overlay">
          <section
            className="hab-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hab-resultado-masivo"
          >
            <header className="hab-modal-header">
              <h2 id="hab-resultado-masivo">
                {resultado.fallidos === 0
                  ? "Operación exitosa"
                  : resultado.exitosos > 0
                    ? "Operación parcialmente completada"
                    : "No se completaron las modificaciones"}
              </h2>
            </header>

            <div className="hab-modal-body">
              <p>El procesamiento de habilitaciones ha finalizado.</p>

              <p>
                <strong>Actualizaciones exitosas:</strong>{" "}
                {resultado.exitosos}
              </p>

              <p>
                <strong>Actualizaciones fallidas:</strong>{" "}
                {resultado.fallidos}
              </p>

              {resultado.resultados
                .filter((r) => !r.exitoso)
                .map((r) => (
                  <p key={r.idEstudiante} className="hab-error">
                    Estudiante #{r.idEstudiante}: {r.mensaje}
                  </p>
                ))}
            </div>

            <footer className="hab-modal-footer">
              <button
                type="button"
                className="hab-btn hab-btn-pri"
                onClick={() => setResultado(null)}
              >
                Aceptar
              </button>
            </footer>
          </section>
        </div>
      )}
    </section>
  );
}
