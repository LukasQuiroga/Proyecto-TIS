
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import {
  FiCheckCircle,
  FiInfo,
  FiBookOpen,
  FiX
} from "react-icons/fi";

import {
  inscribirEstudianteConQr,
  obtenerMensajeErrorQr
} from "../../services/inscripcionQrService";

import { useAuth } from "../../context/useAuth";

import "./InscripcionQr.css";

function InscripcionEstudianteQr() {
  const [searchParams] = useSearchParams();
  const { usuario } = useAuth();

  const tokenUrl = searchParams.get("token") || "";

  const [tokenManual, setTokenManual] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  const esEstudiante = usuario?.nombreRol === "ESTUDIANTE";

  const obtenerToken = () => {
    const valor = tokenManual.trim() || tokenUrl.trim();

    if (!valor) {
      return "";
    }

    try {
      const url = new URL(valor);

      if (url.pathname !== "/inscripcion-qr/inscribir") {
        return "";
      }

      return url.searchParams.get("token")?.trim() || "";
    } catch {
      return valor;
    }
  };

  const confirmarInscripcion = async () => {
    if (procesando) {
      return;
    }

    if (!esEstudiante) {
      setMensaje({
        tipo: "error",
        texto: "Solo los estudiantes pueden inscribirse mediante QR."
      });
      return;
    }

    const token = obtenerToken();

    if (!token) {
      setMensaje({
        tipo: "error",
        texto: "Ingresa o escanea un código QR válido."
      });
      return;
    }

    setProcesando(true);
    setResultado(null);
    setMensaje(null);

    try {
      const datos = await inscribirEstudianteConQr(token);

      setResultado(datos || {});

      setMensaje({
        tipo: "exito",
        texto: "Te inscribiste correctamente en la materia."
      });
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: obtenerMensajeErrorQr(error)
      });
    } finally {
      setProcesando(false);
    }
  };

  return (
    <main className="hu12-pagina">
      <header className="hu12-encabezado">
        <h1>Inscripción a materias mediante QR</h1>

        <p>
          Confirma tu inscripción utilizando el código
          proporcionado por tu docente.
        </p>
      </header>

      <section className="hu12-tarjeta">
        <div className="hu12-tarjeta-titulo">
          <h2>
            <FiBookOpen /> Inscripción a materia
          </h2>

          <p>
            Verifica tus datos antes de confirmar.
          </p>
        </div>

        <div className="hu12-datos-estudiante">
          <strong>Estudiante:</strong>{" "}
          {usuario
            ? `${usuario.nombre || ""} ${usuario.apellido || ""}`.trim()
            : "No identificado"}
        </div>

        {tokenUrl ? (
          <p className="hu12-ayuda">
            <FiCheckCircle />
            Se detectó un enlace de inscripción.
            Presiona el botón para continuar.
          </p>
        ) : (
          <>
            <label htmlFor="hu12-token-estudiante">
              Código o enlace de inscripción
            </label>

            <input
              id="hu12-token-estudiante"
              type="text"
              placeholder="Pega el código proporcionado por tu docente"
              value={tokenManual}
              onChange={(event) =>
                setTokenManual(event.target.value)
              }
              disabled={procesando || resultado !== null}
            />
          </>
        )}

        <p className="hu12-ayuda">
          <FiInfo />
          El código debe estar vigente y solo puedes
          inscribirte una vez en la misma materia.
        </p>

        <div className="hu12-acciones-estudiante">
          <button
            type="button"
            className="hu12-boton-principal"
            onClick={confirmarInscripcion}
            disabled={
              procesando ||
              !esEstudiante ||
              resultado !== null
            }
          >
            <FiCheckCircle />

            {procesando
              ? "Procesando..."
              : resultado !== null
                ? "Inscripción realizada"
                : "Confirmar inscripción"}
          </button>

          <Link
            to="/"
            className="hu12-boton-secundario"
          >
            Cancelar
          </Link>
        </div>
      </section>

      {resultado !== null && (
        <section className="hu12-tarjeta">
          <div className="hu12-resultado-titulo">
            <FiCheckCircle />
            <h2>Inscripción registrada</h2>
          </div>

          {resultado?.nombreMateria && (
            <p>
              <strong>Materia:</strong>{" "}
              {resultado.nombreMateria}
            </p>
          )}

          {resultado?.grupo && (
            <p>
              <strong>Grupo:</strong>{" "}
              {resultado.grupo}
            </p>
          )}

          <p>
            <strong>Estado:</strong> Inscrito
          </p>
        </section>
      )}

      {mensaje && (
        <div
          className="hu12-modal-fondo"
          onClick={() => setMensaje(null)}
        >
          <div
            className="hu12-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="hu12-mensaje-titulo"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="hu12-modal-cerrar"
              aria-label="Cerrar"
              onClick={() => setMensaje(null)}
            >
              <FiX />
            </button>

            <div
              className={`hu12-modal-icono ${mensaje.tipo}`}
            >
              {mensaje.tipo === "exito"
                ? <FiCheckCircle />
                : <FiInfo />}
            </div>

            <h2 id="hu12-mensaje-titulo">
              {mensaje.tipo === "exito"
                ? "Inscripción exitosa"
                : "No se pudo inscribir"}
            </h2>

            <p>{mensaje.texto}</p>

            <button
              type="button"
              className="hu12-boton-principal"
              onClick={() => setMensaje(null)}
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default InscripcionEstudianteQr;