import {FiMapPin, FiX} from "react-icons/fi";

import "./DetalleAmbiente.css";

function DetalleAmbiente({
  ambiente,
  onCerrar,
  onEditar,
}) {
  if (!ambiente) {
    return null;
  }

  return (
    <div className="detalle-ambiente-fondo">
      <div
        className="detalle-ambiente-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalle-ambiente-titulo"
      >
        <header className="detalle-ambiente-encabezado">
          <div>
            <h2 id="detalle-ambiente-titulo">
              <FiMapPin/>
              Detalle del ambiente
            </h2>

            <p>
              Información registrada
              del ambiente.
            </p>
          </div>

          <button
            type="button"
            className="detalle-ambiente-cerrar"
            aria-label="Cerrar detalle"
            onClick={onCerrar}
          >
            <FiX/>
          </button>
        </header>

        <section className="detalle-ambiente-contenido">
          <div className="detalle-ambiente-campo destacado">
            <span>Ambiente</span>

            <strong>
              {ambiente.nombre}
            </strong>
          </div>

          <div className="detalle-ambiente-grid">
            <div className="detalle-ambiente-campo">
              <span>Código</span>

              <strong>
                {ambiente.codigo}
              </strong>
            </div>

            <div className="detalle-ambiente-campo">
              <span>Capacidad</span>

              <strong>
                {ambiente.capacidad} estudiantes
              </strong>
            </div>

            <div className="detalle-ambiente-campo">
              <span>Estado</span>

              <div>
                <span
                  className={
                    ambiente.disponible
                      ? "detalle-ambiente-estado disponible"
                      : "detalle-ambiente-estado no-disponible"
                  }
                >
                  {ambiente.disponible
                    ? "Disponible"
                    : "No disponible"}
                </span>
              </div>
            </div>
          </div>

          <div className="detalle-ambiente-campo">
            <span>Ubicación</span>

            <strong>
              {ambiente.ubicacion}
            </strong>
          </div>
        </section>

        <footer className="detalle-ambiente-acciones">
          <button
            type="button"
            className="detalle-ambiente-secundario"
            onClick={onCerrar}
          >
            Cerrar
          </button>

          <button
            type="button"
            className="detalle-ambiente-principal"
            onClick={() =>
              onEditar(ambiente)
            }
          >
            Editar ambiente
          </button>
        </footer>
      </div>
    </div>
  );
}

export default DetalleAmbiente;