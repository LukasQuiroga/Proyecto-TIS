
import { useEffect, useRef, useState } from "react";
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
  consultarQrActivo,
  renovarQrInscripcion,
  desactivarQrInscripcion,
  obtenerMensajeErrorQr
} from "../../services/inscripcionQrService";

import "./InscripcionQr.css";

function InscripcionQr() {
  const [materias, setMaterias] = useState([]);
  const [idMateria, setIdMateria] = useState("");
  const [cargandoMaterias, setCargandoMaterias] = useState(true);
  const [errorMaterias, setErrorMaterias] = useState("");

  const [consultandoQr, setConsultandoQr] = useState(false);
  const [operacion, setOperacion] = useState("");
  const [resultado, setResultado] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const [desactivado, setDesactivado] = useState(false);
  const [ahora, setAhora] = useState(Date.now());
  const [versionConsulta, setVersionConsulta] = useState(0);

  const bloqueoOperacion = useRef(false);
  const materiaActual = useRef("");

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

  useEffect(() => {
    const intervalo = window.setInterval(() => {
      setAhora(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalo);
  }, []);

  useEffect(() => {
    let activo = true;

    const cargarQrActivo = async () => {
      setResultado(null);
      setCopiado(false);
      setDesactivado(false);

      if (!idMateria) {
        setConsultandoQr(false);
        return;
      }

      setConsultandoQr(true);

      try {
        const datos = await consultarQrActivo(
          Number(idMateria)
        );

        if (!activo) {
          return;
        }

        if (datos?.estado === "ACTIVO" && datos?.token) {
          setResultado(datos);
        } else if (
          datos?.estado === "ACTIVO_SIN_TOKEN_RECUPERABLE"
        ) {
          setMensaje({
            tipo: "error",
            texto:
              "Existe un QR activo anterior que no puede recuperarse. Espera a que venza."
          });
        }
      } catch (error) {
        if (activo) {
          setMensaje({
            tipo: "error",
            texto: obtenerMensajeErrorQr(error)
          });
        }
      } finally {
        if (activo) {
          setConsultandoQr(false);
        }
      }
    };

    cargarQrActivo();

    return () => {
      activo = false;
    };
  }, [idMateria, versionConsulta]);

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
  };

  const materiaSeleccionada = materias.find(
    (materia) => String(materia.idMateria) === idMateria
  );

  const fechaVencimiento = resultado?.fechaExpiracion
    ? new Date(resultado.fechaExpiracion)
    : null;

  const fechaValida =
    fechaVencimiento &&
    !Number.isNaN(fechaVencimiento.getTime());

  const qrVigente =
    Boolean(resultado?.token) &&
    Boolean(fechaValida) &&
    fechaVencimiento.getTime() > ahora &&
    !desactivado;

  const procesando = Boolean(operacion) || consultandoQr;

  const validarMateria = () => {
    const materiaId = Number(idMateria);

    if (
      !Number.isSafeInteger(materiaId) ||
      materiaId <= 0 ||
      !materias.some(
        (materia) => materia.idMateria === materiaId
      )
    ) {
      mostrarMensaje(
        "error",
        "Selecciona una materia válida de la lista."
      );
      return null;
    }

    return materiaId;
  };

  const generarCodigo = async (event) => {
    event.preventDefault();

    const materiaId = validarMateria();

    if (!materiaId) {
      return;
    }

    if (qrVigente) {
      mostrarMensaje(
        "error",
        "Esta materia ya tiene un QR activo."
      );
      return;
    }

    if (
      bloqueoOperacion.current ||
      procesando
    ) {
      return;
    }

    bloqueoOperacion.current = true;
    setOperacion("generar");
    setMensaje(null);

    try {
      const datos = await generarQrInscripcion(materiaId);

      if (!datos?.token) {
        throw new Error(
          "El servidor no devolvió un QR válido."
        );
      }

      if (materiaActual.current === String(materiaId)) {
        setResultado(datos);
        setDesactivado(false);
        setCopiado(false);

        mostrarMensaje(
          "exito",
          "El código QR se generó correctamente."
        );
      }
    } catch (error) {
      mostrarMensaje(
        "error",
        obtenerMensajeErrorQr(error, "generar")
      );

      if (error?.response?.status === 409) {
        setVersionConsulta((valor) => valor + 1);
      }
    } finally {
      bloqueoOperacion.current = false;
      setOperacion("");
    }
  };

  const solicitarRenovacion = () => {
    if (!qrVigente || procesando) {
      return;
    }

    setConfirmacion({
      tipo: "renovar",
      titulo: "Renovar código QR",
      texto:
        "¿Deseas renovar este código QR? El código anterior quedará invalidado y se generará uno nuevo."
    });
  };

  const solicitarDesactivacion = () => {
    if (!qrVigente || procesando) {
      return;
    }

    setConfirmacion({
      tipo: "desactivar",
      titulo: "Desactivar código QR",
      texto:
        "¿Deseas desactivar este código QR? Los estudiantes ya no podrán inscribirse utilizando este código."
    });
  };

  const ejecutarAccion = async () => {
    if (
      !confirmacion ||
      bloqueoOperacion.current ||
      procesando
    ) {
      return;
    }

    const materiaId = validarMateria();

    if (!materiaId) {
      setConfirmacion(null);
      return;
    }

    const tipo = confirmacion.tipo;

    bloqueoOperacion.current = true;
    setOperacion(tipo);
    setConfirmacion(null);
    setMensaje(null);

    try {
      if (tipo === "renovar") {
        const datos = await renovarQrInscripcion(
          materiaId
        );

        if (!datos?.token) {
          throw new Error(
            "No se recibió el nuevo código QR."
          );
        }

        if (materiaActual.current === String(materiaId)) {
          setResultado(datos);
          setCopiado(false);
          setDesactivado(false);

          mostrarMensaje(
            "exito",
            "El código QR se renovó correctamente. El anterior ya no es válido."
          );
        }
      } else if (tipo === "desactivar") {
        const datos = await desactivarQrInscripcion(
          materiaId
        );

        if (datos?.estado !== "DESACTIVADO") {
          throw new Error(
            "No se pudo confirmar la desactivación."
          );
        }

        if (materiaActual.current === String(materiaId)) {
          setResultado(null);
          setCopiado(false);
          setDesactivado(true);

          mostrarMensaje(
            "exito",
            "El código QR fue desactivado correctamente."
          );
        }
      }
    } catch (error) {
      mostrarMensaje(
        "error",
        obtenerMensajeErrorQr(error, tipo)
      );

      setVersionConsulta((valor) => valor + 1);
    } finally {
      bloqueoOperacion.current = false;
      setOperacion("");
    }
  };

  const copiarToken = async () => {
    if (!resultado?.token || !qrVigente) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        resultado.token
      );

      setCopiado(true);
    } catch {
      mostrarMensaje(
        "error",
        "No se pudo copiar el token automáticamente."
      );
    }
  };

  const enlaceInscripcion = qrVigente
    ? `${window.location.origin}/inscripcion-qr/inscribir?token=${encodeURIComponent(resultado.token)}`
    : "";

  return (
    <main className="hu12-pagina">
      <header className="hu12-encabezado">
        <div>
          <Link
            className="hu12-volver"
            to="/asignaturas"
          >
            <FiArrowLeft />
            Volver a asignaturas
          </Link>

          <h1>
            Inscripción de estudiantes mediante QR
          </h1>

          <p>
            Genera un código temporal para que los
            estudiantes se inscriban en una materia asignada.
          </p>
        </div>
      </header>

      <section className="hu12-tarjeta">
        <div className="hu12-tarjeta-titulo">
          <h2>Gestión de código de inscripción</h2>

          <p>
            Cada código QR tiene una vigencia de 10 minutos.
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
              materiaActual.current = event.target.value;
              setIdMateria(event.target.value);
              setResultado(null);
              setCopiado(false);
              setMensaje(null);
              setConfirmacion(null);
              setDesactivado(false);
            }}
            disabled={
              cargandoMaterias ||
              procesando ||
              materias.length === 0
            }
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
                {materia.grupo
                  ? ` - Grupo ${materia.grupo}`
                  : ""}
              </option>
            ))}
          </select>

          {errorMaterias && (
            <p
              className="hu12-error-materias"
              role="alert"
            >
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
              {qrVigente
                ? "Código QR activo para "
                : "Materia seleccionada: "}
              <strong>
                {materiaSeleccionada.nombreAsignatura}
              </strong>
              {materiaSeleccionada.grupo
                ? `, grupo ${materiaSeleccionada.grupo}.`
                : "."}
            </p>
          )}

          {consultandoQr && (
            <p className="hu12-ayuda">
              <FiRefreshCw />
              Consultando código QR activo...
            </p>
          )}

          {qrVigente && (
            <p className="hu12-ayuda">
              <FiCheckCircle />
              Esta materia tiene un QR vigente.
            </p>
          )}

          {desactivado && (
            <p className="hu12-ayuda">
              <FiInfo />
              Estado del código: Desactivado.
              Puedes generar uno nuevo.
            </p>
          )}

          <button
            type="submit"
            className="hu12-boton-principal"
            disabled={
              cargandoMaterias ||
              procesando ||
              qrVigente ||
              !idMateria ||
              materias.length === 0
            }
          >
            <FiRefreshCw />
            {operacion === "generar"
              ? "Generando..."
              : consultandoQr
                ? "Consultando..."
                : qrVigente
                  ? "Código QR activo"
                  : "Generar código"}
          </button>
        </form>
      </section>

      {qrVigente && (
        <section className="hu12-tarjeta">
          <div className="hu12-resultado-titulo">
            <FiCheckCircle />
            <h2>Código de inscripción activo</h2>
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

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              marginTop: "20px"
            }}
          >
            <button
              type="button"
              className="hu12-boton-principal"
              onClick={solicitarRenovacion}
              disabled={procesando}
            >
              <FiRefreshCw />
              {operacion === "renovar"
                ? "Renovando..."
                : "Renovar QR"}
            </button>

            <button
              type="button"
              className="hu12-boton-secundario"
              onClick={solicitarDesactivacion}
              disabled={procesando}
            >
              <FiX />
              {operacion === "desactivar"
                ? "Desactivando..."
                : "Desactivar QR"}
            </button>
          </div>
        </section>
      )}

      {resultado && !qrVigente && (
        <section className="hu12-tarjeta">
          <div className="hu12-resultado-titulo">
            <FiClock />
            <h2>Código QR vencido</h2>
          </div>

          <p className="hu12-ayuda">
            El código ha vencido.
            Puedes generar uno nuevo.
          </p>
        </section>
      )}

      {confirmacion && (
        <div className="hu12-modal-fondo">
          <div
            className="hu12-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="hu12-confirmacion-titulo"
          >
            <div className="hu12-modal-icono">
              <FiInfo />
            </div>

            <h2 id="hu12-confirmacion-titulo">
              {confirmacion.titulo}
            </h2>

            <p>{confirmacion.texto}</p>

            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "center",
                marginTop: "20px"
              }}
            >
              <button
                type="button"
                className="hu12-boton-secundario"
                onClick={() => setConfirmacion(null)}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="hu12-boton-principal"
                onClick={ejecutarAccion}
                disabled={procesando}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
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
