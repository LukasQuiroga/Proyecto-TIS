import { FiClipboard, FiX } from "react-icons/fi";

import {
  formatearTipoEvaluacion,
  obtenerEstadoExamen,
  obtenerEstadoRecurso,
  obtenerNombreAsignatura,
} from "./utilsExamen.js";

import "./DetalleExamen.css";

function formatearFecha(valor) {
  if (!valor) {
    return "—";
  }

  const fecha = new Date(`${valor}T00:00:00`);

  if (Number.isNaN(fecha.getTime())) {
    return String(valor);
  }

  return fecha.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatearHora(valor) {
  if (!valor) {
    return "—";
  }

  return String(valor).slice(0, 5);
}

function DetalleExamen({ examen, onCerrar }) {
  if (!examen) {
    return null;
  }

  const estadoVisual = obtenerEstadoExamen(examen.estado);

  const habilitaciones = obtenerEstadoRecurso(
    examen.habilitaciones ?? examen.estadoHabilitaciones,
  );

  const ambientes = obtenerEstadoRecurso(
    examen.ambientes ?? examen.estadoAmbientes,
  );

  return (
    <div className="detalle-examen-fondo">
      <div
        className="detalle-examen-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalle-examen-titulo"
      >
        <header className="detalle-examen-encabezado">
          <div>
            <h2 id="detalle-examen-titulo">
              <FiClipboard />
              Detalle del examen
            </h2>

            <p>Información del examen registrado.</p>
          </div>

          <button
            type="button"
            className="detalle-examen-cerrar"
            aria-label="Cerrar detalles"
            onClick={onCerrar}
          >
            <FiX />
          </button>
        </header>

        <section className="detalle-examen-contenido">
          <div className="detalle-examen-campo">
            <span>Nombre del examen</span>
            <strong>{examen.nombreExamen || "—"}</strong>
          </div>

          <div className="detalle-examen-grid">
            <div className="detalle-examen-campo">
              <span>Código</span>
              <strong>{examen.codigo || "—"}</strong>
            </div>

            <div className="detalle-examen-campo">
              <span>Asignatura</span>
              <strong>{obtenerNombreAsignatura(examen)}</strong>
            </div>

            <div className="detalle-examen-campo">
              <span>Tipo de evaluación</span>
              <strong>{formatearTipoEvaluacion(examen.tipoEvaluacion)}</strong>
            </div>

            <div className="detalle-examen-campo">
              <span>Gestión</span>
              <strong>{examen.gestion || "—"}</strong>
            </div>

            <div className="detalle-examen-campo">
              <span>Fecha</span>
              <strong>{formatearFecha(examen.fechaExamen)}</strong>
            </div>

            <div className="detalle-examen-campo">
              <span>Horario</span>
              <strong>
                {formatearHora(examen.horaInicio)} -{" "}
                {formatearHora(examen.horaFin)}
              </strong>
            </div>

            <div className="detalle-examen-campo">
              <span>Aula</span>
              <strong>{examen.aula || "—"}</strong>
            </div>

            <div className="detalle-examen-campo">
              <span>Estado</span>
              <div>
                <span
                  className={`detalle-examen-badge ${estadoVisual.clase}`}
                >
                  {estadoVisual.etiqueta}
                </span>
              </div>
            </div>

            <div className="detalle-examen-campo">
              <span>Habilitaciones</span>
              <div>
                <span className={`detalle-examen-badge ${habilitaciones.clase}`}>
                  {habilitaciones.etiqueta}
                </span>
              </div>
            </div>

            <div className="detalle-examen-campo">
              <span>Ambientes</span>
              <div>
                <span className={`detalle-examen-badge ${ambientes.clase}`}>
                  {ambientes.etiqueta}
                </span>
              </div>
            </div>
          </div>
        </section>

        <footer className="detalle-examen-acciones">
          <button type="button" onClick={onCerrar}>
            Cerrar
          </button>
        </footer>
      </div>
    </div>
  );
}

export default DetalleExamen;
