import { useNavigate } from "react-router-dom";
import { FaLock } from "react-icons/fa";

import "./AccesoNoAutorizadoExamenes.css";

function AccesoNoAutorizadoExamenes() {
  const navigate = useNavigate();

  return (
    <div className="acceso-examenes-pagina">
      <h1 className="acceso-examenes-titulo">Registrar examen</h1>

      <section className="acceso-examenes-tarjeta">
        <span className="acceso-examenes-icono">
          <FaLock />
        </span>

        <h2 className="acceso-examenes-mensaje-titulo">
          Acceso no autorizado
        </h2>

        <p className="acceso-examenes-mensaje">
          No tienes permisos para registrar ni gestionar exámenes. Si
          consideras que esto es un error, contacta al administrador del
          sistema.
        </p>

        <button
          type="button"
          className="acceso-examenes-boton"
          onClick={() => navigate("/")}
        >
          Volver al inicio
        </button>
      </section>
    </div>
  );
}

export default AccesoNoAutorizadoExamenes;
