import { FiAlertCircle } from "react-icons/fi";

import "./ModalError.css";

function ModalError({
  abierto,
  titulo = "Ocurrió un error",
  mensaje,
  textoBoton = "Aceptar",
  onCerrar,
}) {
  if (!abierto) {
    return null;
  }

  return (
    <div className="modal-error-fondo" role="presentation">
      <div
        className="modal-error"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="modal-error-titulo"
      >
        <span className="modal-error-icono">
          <FiAlertCircle />
        </span>

        <h2 id="modal-error-titulo">{titulo}</h2>

        {mensaje && <p>{mensaje}</p>}

        <button type="button" onClick={onCerrar}>
          {textoBoton}
        </button>
      </div>
    </div>
  );
}

export default ModalError;
