import { FiBookOpen, FiX } from "react-icons/fi";

import "./DetalleAsignatura.css";

function DetalleAsignatura({ asignatura, onCerrar }) {
  if (!asignatura) {
    return null;
  }

  return (
    <div className="detalle-asignatura-fondo">
      <div
        className="detalle-asignatura-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalle-asignatura-titulo"
      >
        <header className="detalle-asignatura-encabezado">
          <div>
            <h2 id="detalle-asignatura-titulo">
              <FiBookOpen />
              Detalle de asignatura
            </h2>
            <p>Información de la asignatura registrada.</p>
          </div>

          <button
            type="button"
            className="detalle-asignatura-cerrar"
            aria-label="Cerrar detalles"
            onClick={onCerrar}
          >
            <FiX />
          </button>
        </header>

        <section className="detalle-asignatura-contenido">
          <div className="detalle-asignatura-campo">
            <span>Nombre de la asignatura</span>
            <strong>{asignatura.nombreAsignatura}</strong>
          </div>

          <div className="detalle-asignatura-grid">
            <div className="detalle-asignatura-campo">
              <span>Código</span>
              <strong>{asignatura.codigoAsignatura}</strong>
            </div>

            <div className="detalle-asignatura-campo">
              <span>Semestre</span>
              <strong>{asignatura.semestre}</strong>
            </div>

            <div className="detalle-asignatura-campo">
              <span>Estado</span>
              <div>
                <span
                  className={
                    asignatura.activo
                      ? "detalle-asignatura-estado activa"
                      : "detalle-asignatura-estado inactiva"
                  }
                >
                  {asignatura.activo ? "Activa" : "Inactiva"}
                </span>
              </div>
            </div>
          </div>

          <div className="detalle-asignatura-campo">
            <span>Carreras asociadas</span>

            <div className="detalle-asignatura-carreras">
              {(asignatura.carreras || []).map((carrera) => (
                <span key={carrera}>{carrera}</span>
              ))}

              {(!asignatura.carreras ||
                asignatura.carreras.length === 0) && (
                <p>No tiene carreras asociadas.</p>
              )}
            </div>
          </div>

          <div className="detalle-asignatura-campo">
            <span>Descripción</span>
            <p className="detalle-asignatura-descripcion">
              {asignatura.descripcion || "Sin descripción registrada."}
            </p>
          </div>
        </section>

        <footer className="detalle-asignatura-acciones">
          <button type="button" onClick={onCerrar}>
            Cerrar
          </button>
        </footer>
      </div>
    </div>
  );
}

export default DetalleAsignatura;