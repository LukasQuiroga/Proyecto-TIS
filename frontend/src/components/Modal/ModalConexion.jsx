import { useEffect, useState } from "react";
import { FiWifiOff } from "react-icons/fi";

import "./ModalConexion.css";

function ModalConexion() {
  const [sinConexion, setSinConexion] = useState(
    () => typeof navigator !== "undefined" && !navigator.onLine,
  );
  const [descartado, setDescartado] = useState(false);

  useEffect(() => {
    const alPerderConexion = () => {
      setSinConexion(true);
      setDescartado(false);
    };

    const alRestablecerConexion = () => {
      setSinConexion(false);
      setDescartado(false);
    };

    window.addEventListener("offline", alPerderConexion);
    window.addEventListener("online", alRestablecerConexion);

    return () => {
      window.removeEventListener("offline", alPerderConexion);
      window.removeEventListener("online", alRestablecerConexion);
    };
  }, []);

  if (!sinConexion || descartado) {
    return null;
  }

  return (
    <div className="modal-conexion-fondo" role="presentation">
      <div
        className="modal-conexion"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="modal-conexion-titulo"
      >
        <span className="modal-conexion-icono">
          <FiWifiOff />
        </span>

        <h2 id="modal-conexion-titulo">Sin conexión a internet</h2>

        <p>
          Se perdió la conectividad de red. Algunas acciones podrían fallar
          hasta que la conexión se restablezca.
        </p>

        <button type="button" onClick={() => setDescartado(true)}>
          Entendido
        </button>
      </div>
    </div>
  );
}

export default ModalConexion;
