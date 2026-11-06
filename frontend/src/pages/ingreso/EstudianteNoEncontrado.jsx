
import {
  FiAlertCircle,
  FiInfo,
  FiRefreshCw,
  FiUser,
  FiXCircle,
} from "react-icons/fi";

import "./EstudianteNoEncontrado.css";

function EstudianteNoEncontrado({
  codigoConsultado,
  onReintentar,
}) {
  return (
    <section
      className="hu15-no-encontrado"
      aria-labelledby="hu15-error-titulo"
    >
      <div className="hu15-no-encontrado-alerta" role="alert">
        <FiXCircle aria-hidden="true" />

        <div>
          <h2 id="hu15-error-titulo">
            Estudiante no encontrado
          </h2>

          <p>
            El código ingresado no existe en el sistema.
          </p>
        </div>
      </div>

      <div className="hu15-no-encontrado-contenido">

        <div className="hu15-no-encontrado-foto">
          <div className="hu15-no-encontrado-avatar">
            <FiUser aria-hidden="true" />
          </div>

          <span>Foto no disponible</span>
        </div>

        <div className="hu15-no-encontrado-informacion">
          <div className="hu15-no-encontrado-codigo">
            <span>Código consultado:</span>
            <strong>{codigoConsultado}</strong>
          </div>

          <h3>
            No se encontró ningún estudiante con el
            código ingresado.
          </h3>

          <div className="hu15-no-encontrado-recomendaciones">
            <div className="hu15-no-encontrado-subtitulo">
              <FiInfo aria-hidden="true" />
              <h4>Recomendaciones</h4>
            </div>

            <ul>
              <li>
                Verifique que el código sea correcto.
              </li>

              <li>
                Asegúrese de que el estudiante esté registrado.
              </li>

              <li>
                Si el problema persiste, comuníquese
                con el administrador.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="hu15-no-encontrado-acciones">
        <button
          type="button"
          className="hu15-no-encontrado-reintentar"
          onClick={onReintentar}
        >
          <FiRefreshCw aria-hidden="true" />
          Intentar nuevamente
        </button>
      </div>
    </section>
  );
}

export default EstudianteNoEncontrado;
