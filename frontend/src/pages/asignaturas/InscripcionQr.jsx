
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Link } from "react-router-dom";

import {
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiCopy,
  FiInfo,
  FiRefreshCw,
  FiX
} from "react-icons/fi";

import {
  obtenerMateriasDocenteQr,
  generarQrInscripcion,
  obtenerMensajeErrorQr
} from "../../services/inscripcionQrService";

import "./InscripcionQr.css";

function InscripcionQr() {
  const [materias, setMaterias] = useState([]);
  const [idMateria, setIdMateria] = useState("");
  const [cargandoMaterias, setCargandoMaterias] = useState(true);
  const [errorMaterias, setErrorMaterias] = useState("");

  const [generando, setGenerando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [copiado, setCopiado] = useState(false);

  // HU12 - Cargar las materias asignadas al docente
  useEffect(() => {
    let activo = true;

    const cargarMaterias = async () => {
      try {
        const datos = await obtenerMateriasDocenteQr();

        if (activo) {
          setMaterias(datos);
          setErrorMaterias("");
        }
      } catch (error) {
        if (activo) {
          setMaterias([]);
          setErrorMaterias(obtenerMensajeErrorQr(error));
        }
      } finally {
        if (activo) {
          setCargandoMaterias(false);
        }
      }
    };

    cargarMaterias();

    return () => {
      activo = false;
    };
  }, []);

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
  };

  const generarCodigo = async (event) => {
    event.preventDefault();

    const materiaId = Number(idMateria);

    if (
      !Number.isSafeInteger(materiaId) ||
      materiaId <= 0 ||
      !materias.some((materia) => materia.idMateria === materiaId)
    ) {
      mostrarMensaje(
        "error",
        "Selecciona una materia válida de la lista."
      );
      return;
    }

    setGenerando(true);
    setResultado(null);
    setCopiado(false);

    try {
      const datos = await generarQrInscripcion(materiaId);

      if (!datos?.token) {
        throw new Error(
          "El servidor no devolvió un código de inscripción válido."
        );
      }

      setResultado(datos);

      mostrarMensaje(
        "exito",
        "El código de inscripción se generó correctamente."
      );
    } catch (error) {
      mostrarMensaje(
        "error",
        obtenerMensajeErrorQr(error)
      );
    } finally {
      setGenerando(false);
    }
  };

  const copiarToken = async () => {
    if (!resultado?.token) {
      return;
    }

    try {
      await navigator.clipboard.writeText(resultado.token);
      setCopiado(true);
    } catch {
      mostrarMensaje(
        "error",
        "No se pudo copiar el token automáticamente."
      );
    }
  };

  const materiaSeleccionada = materias.find(
    (materia) => String(materia.idMateria) === idMateria
  );

  const enlaceInscripcion = resultado?.token
    ? `${window.location.origin}/inscripcion-qr/inscribir?token=${encodeURIComponent(resultado.token)}`
    : "";

  const fechaVencimiento = resultado?.fechaExpiracion
    ? new Date(resultado.fechaExpiracion)
    : null;

  const fechaValida =
    fechaVencimiento &&
    !Number.isNaN(fechaVencimiento.getTime());

  return (
    <main className="hu12-pagina">
      <header className="hu12-encabezado">
        <div>
          <Link className="hu12-volver" to="/asignaturas">
            <FiArrowLeft /> Volver a asignaturas
          </Link>

          <h1>Inscripción de estudiantes mediante QR</h1>

          <p>
            Genera un código temporal para que los estudiantes
            se inscriban en una materia asignada.
          </p>
        </div>
      </header>

      <section className="hu12-tarjeta">
        <div className="hu12-tarjeta-titulo">
          <h2>Generar código de inscripción</h2>

          <p>
            El código será válido durante 10 minutos.
          </p>
        </div>

        <form onSubmit={generarCodigo}>
          <label htmlFor="hu12-materia">
            Seleccionar materia asignada
          </label>

          <select
            id="hu12-materia"
            className="hu12-selector-materia"
            value={idMateria}
            onChange={(event) => {
              setIdMateria(event.target.value);
              setResultado(null);
              setCopiado(false);
            }}
            disabled={cargandoMaterias || generando || materias.length === 0}
            required
          >
            <option value="">
              {cargandoMaterias
                ? "Cargando materias..."
                : materias.length === 0
                  ? "No hay materias disponibles"
                  : "Selecciona una materia"}
            </option>

            {materias.map((materia) => (
              <option
                key={materia.idMateria}
                value={materia.idMateria}
              >
                {materia.nombreAsignatura}
                {materia.grupo ? ` - Grupo ${materia.grupo}` : ""}
              </option>
            ))}
          </select>

          {errorMaterias && (
            <p className="hu12-error-materias" role="alert">
              <FiInfo />
              {errorMaterias}
            </p>
          )}

          {!cargandoMaterias &&
            !errorMaterias &&
            materias.length === 0 && (
              <p className="hu12-ayuda">
                <FiInfo />
                No tienes materias asignadas actualmente.
                Contacta al responsable académico.
              </p>
            )}

          {materiaSeleccionada && (
            <p className="hu12-ayuda">
              <FiInfo />
              Generarás un QR para
              {" "}<strong>{materiaSeleccionada.nombreAsignatura}</strong>
              {materiaSeleccionada.grupo
                ? `, grupo ${materiaSeleccionada.grupo}.`
                : "."}
            </p>
          )}

          <button
            type="submit"
            className="hu12-boton-principal"
            disabled={
              cargandoMaterias ||
              generando ||
              !idMateria ||
              materias.length === 0
            }
          >
            <FiRefreshCw />
            {generando ? "Generando..." : "Generar código"}
          </button>
        </form>
      </section>

      {resultado && (
        <section className="hu12-tarjeta">
          <div className="hu12-resultado-titulo">
            <FiCheckCircle />
            <h2>Código de inscripción generado</h2>
          </div>

          <div className="hu12-codigo-visual">
            <QRCodeSVG
              value={enlaceInscripcion}
              size={230}
              level="M"
              marginSize={2}
              title="Código QR de inscripción a la materia"
            />

            <p>
              Escanea este código con tu celular para
              inscribirte en la materia.
            </p>
          </div>

          <div className="hu12-token">
            <span>Token de inscripción</span>

            <code>{resultado.token}</code>

            <button
              type="button"
              className="hu12-boton-secundario"
              onClick={copiarToken}
            >
              <FiCopy />
              {copiado ? "Copiado" : "Copiar token"}
            </button>
          </div>

          <p className="hu12-vencimiento">
            <FiClock />
            {fechaValida
              ? `Vence el ${fechaVencimiento.toLocaleString("es-BO")}`
              : "No se pudo determinar la fecha de vencimiento."}
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
            aria-labelledby="hu12-modal-titulo"
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

            <h2 id="hu12-modal-titulo">
              {mensaje.tipo === "exito"
                ? "Operación exitosa"
                : "No se pudo completar"}
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

export default InscripcionQr;