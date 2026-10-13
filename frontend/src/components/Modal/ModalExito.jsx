import { FiCheckCircle } from "react-icons/fi";

import "./ModalExito.css";

function ModalExito({
  abierto,
  titulo = "Operación exitosa",
  mensaje,
  textoBoton = "Aceptar",
  onCerrar,
}) {
  if (!abierto) {
    return null;
  }

  return (
    <div className="modal-exito-fondo" role="presentation">
      <div
        className="modal-exito"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-exito-titulo"
      >
        <span className="modal-exito-icono">
          <FiCheckCircle />
        </span>

        <h2 id="modal-exito-titulo">{titulo}</h2>

        {mensaje && <p>{mensaje}</p>}

        <button type="button" onClick={onCerrar}>
          {textoBoton}
        </button>
      </div>
    </div>
  );
}

export default ModalExito;
