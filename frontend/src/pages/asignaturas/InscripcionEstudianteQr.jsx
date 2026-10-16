import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";

import {
  FiCheckCircle,
  FiInfo,
  FiBookOpen,
  FiCamera,
  FiX
} from "react-icons/fi";

import {
  validarQrInscripcion,
  inscribirEstudianteConQr,
  obtenerMensajeErrorQr
} from "../../services/inscripcionQrService";

import { useAuth } from "../../context/useAuth";

import "./InscripcionQr.css";

function obtenerToken(valor) {
  if (typeof valor !== "string") {
    return "";
  }

  const codigo = valor.trim();

  if (!codigo) {
    return "";
  }

  try {
    const url = new URL(codigo);

    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.pathname !== "/inscripcion-qr/inscribir"
    ) {
      return "";
    }

    return url.searchParams.get("token")?.trim() || "";
  } catch {
    return codigo;
  }
}

function obtenerFechaFormateada(fecha) {
  if (!fecha) {
    return "No disponible";
  }

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return "No disponible";
  }

  return valor.toLocaleString("es-BO", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function InscripcionEstudianteQr() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const tokenUrl = searchParams.get("token") || "";
  const esEstudiante = usuario?.nombreRol === "ESTUDIANTE";

  const [tokenManual, setTokenManual] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [vistaPrevia, setVistaPrevia] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [camaraAbierta, setCamaraAbierta] = useState(false);

  const solicitudActual = useRef(0);
  const lecturaRealizada = useRef(false);

  const abrirEnlaceInscripcion = useCallback((token) => {
    navigate(
      {
        pathname: "/inscripcion-qr/inscribir",
        search: `?token=${encodeURIComponent(token)}`
      },
      { replace: true }
    );
  }, [navigate]);

  const validarToken = useCallback(async (token) => {
    const numeroSolicitud = ++solicitudActual.current;

    setProcesando(true);
    setVistaPrevia(null);
    setResultado(null);
    setMensaje(null);

    try {
      const datos = await validarQrInscripcion(token);

      if (numeroSolicitud !== solicitudActual.current) {
        return;
      }

      setVistaPrevia({
        token,
        datos
      });
    } catch (error) {
      if (numeroSolicitud !== solicitudActual.current) {
        return;
      }

      setMensaje({
        tipo: "error",
        texto: obtenerMensajeErrorQr(error, "validar")
      });
    } finally {
      if (numeroSolicitud === solicitudActual.current) {
        setProcesando(false);
      }
    }
  }, []);

  useEffect(() => {
    const numeroSolicitud = ++solicitudActual.current;

    if (!tokenUrl || !esEstudiante) {
      const solicitudRef = solicitudActual;
      return () => {
        if (numeroSolicitud === solicitudRef.current) {
          solicitudRef.current++;
        }
      };
    }

    const token = obtenerToken(tokenUrl);

    if (!token) {
      Promise.resolve().then(() => {
        if (numeroSolicitud !== solicitudActual.current) return;
        setProcesando(false);
        setVistaPrevia(null);
        setResultado(null);
        setMensaje({
          tipo: "error",
          texto: "El enlace no contiene un código QR válido."
        });
      });
    } else {
      validarToken(token);
    }

    const solicitudRef = solicitudActual;
    return () => {
      solicitudRef.current++;
    };
  }, [tokenUrl, esEstudiante, validarToken]);

  useEffect(() => {
    if (!camaraAbierta) {
      return;
    }

    let cancelado = false;
    let scanner = null;
    let iniciado = false;

    const iniciarCamara = async () => {
      try {
        scanner = new Html5Qrcode("hu12-lector-qr", {
          verbose: false
        });

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10
          },
          (textoEscaneado) => {
            if (
              cancelado ||
              lecturaRealizada.current
            ) {
              return;
            }

            lecturaRealizada.current = true;

            const token = obtenerToken(textoEscaneado);

            setCamaraAbierta(false);

            if (!token) {
              setMensaje({
                tipo: "error",
                texto: "El QR escaneado no contiene un enlace de inscripción válido."
              });
              return;
            }

            setTokenManual(token);
            abrirEnlaceInscripcion(token);
          },
          () => {}
        );

        iniciado = true;

        if (cancelado) {
          await scanner.stop();
          iniciado = false;
          await scanner.clear();
        }
      } catch (error) {
        if (!cancelado) {
          console.error("ERROR CAMARA QR:", error);

          setCamaraAbierta(false);
          setMensaje({
            tipo: "error",
            texto:
              "No se pudo abrir la cámara. Verifica los permisos del navegador y utiliza localhost o HTTPS."
          });
        }
      }
    };

    iniciarCamara();

    return () => {
      cancelado = true;

      if (scanner && iniciado) {
        scanner.stop()
          .catch(() => {})
          .finally(() => {
            scanner.clear().catch(() => {});
          });
      }
    };
  }, [camaraAbierta, abrirEnlaceInscripcion]);

  useEffect(() => {
    const solicitudRef = solicitudActual;
    return () => {
      solicitudRef.current++;
    };
  }, []);

  const cambiarTokenManual = (event) => {
    if (procesando || resultado !== null) {
      return;
    }

    solicitudActual.current++;

    setTokenManual(event.target.value);
    setVistaPrevia(null);
    setResultado(null);
    setMensaje(null);
  };

  const validarCodigoManual = async () => {
    if (
      procesando ||
      resultado !== null ||
      camaraAbierta
    ) {
      return;
    }

    if (!esEstudiante) {
      setMensaje({
        tipo: "error",
        texto: "Solo los estudiantes pueden inscribirse mediante QR."
      });
      return;
    }

    const token = obtenerToken(tokenManual);

    if (!token) {
      setMensaje({
        tipo: "error",
        texto: "Ingresa un código o enlace de inscripción válido."
      });
      return;
    }

    abrirEnlaceInscripcion(token);
  };

  const abrirCamara = () => {
    if (
      procesando ||
      resultado !== null ||
      !esEstudiante
    ) {
      return;
    }

    solicitudActual.current++;

    lecturaRealizada.current = false;

    setVistaPrevia(null);
    setMensaje(null);
    setCamaraAbierta(true);
  };

  const cerrarCamara = () => {
    setCamaraAbierta(false);
  };

  const confirmarInscripcion = async () => {
    if (
      procesando ||
      resultado !== null ||
      camaraAbierta
    ) {
      return;
    }

    if (!esEstudiante) {
      setMensaje({
        tipo: "error",
        texto: "Solo los estudiantes pueden inscribirse mediante QR."
      });
      return;
    }

    if (!vistaPrevia?.token) {
      setMensaje({
        tipo: "error",
        texto: "Primero debes validar el código QR."
      });
      return;
    }

    const numeroSolicitud = ++solicitudActual.current;

    setProcesando(true);
    setMensaje(null);

    try {
      const datos = await inscribirEstudianteConQr(
        vistaPrevia.token
      );

      if (numeroSolicitud !== solicitudActual.current) {
        return;
      }

      setResultado(datos || {});

      setMensaje({
        tipo: "exito",
        texto: "Te inscribiste correctamente en la materia."
      });
    } catch (error) {
      if (numeroSolicitud !== solicitudActual.current) {
        return;
      }

      setVistaPrevia(null);

      setMensaje({
        tipo: "error",
        texto: obtenerMensajeErrorQr(error, "inscripcion")
      });
    } finally {
      if (numeroSolicitud === solicitudActual.current) {
        setProcesando(false);
      }
    }
  };

  return (
    <main className="hu12-pagina">
      <header className="hu12-encabezado">
        <h1>Inscripción a materias mediante QR</h1>

        <p>
          Verifica los datos de la materia antes de
          confirmar tu inscripción.
        </p>
      </header>

      <section className="hu12-tarjeta">
        <div className="hu12-tarjeta-titulo">
          <h2>
            <FiBookOpen /> Inscripción a materia
          </h2>

          <p>
            Consulta la información asociada al código QR.
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
            El sistema verificará automáticamente su validez.
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
              onChange={cambiarTokenManual}
              disabled={
                procesando ||
                resultado !== null ||
                camaraAbierta
              }
            />

            <div className="hu12-acciones-estudiante">
              <button
                type="button"
                className="hu12-boton-principal"
                onClick={validarCodigoManual}
                disabled={
                  procesando ||
                  !esEstudiante ||
                  resultado !== null ||
                  camaraAbierta ||
                  !tokenManual.trim()
                }
              >
                <FiCheckCircle />

                Validar código QR
              </button>

              <button
                type="button"
                className="hu12-boton-secundario"
                onClick={abrirCamara}
                disabled={
                  procesando ||
                  !esEstudiante ||
                  resultado !== null ||
                  camaraAbierta
                }
              >
                <FiCamera /> Escanear con cámara
              </button>
            </div>
          </>
        )}

        {camaraAbierta && (
          <div className="hu12-lector-contenedor">
            <h3>Escanear código QR</h3>

            <p className="hu12-ayuda">
              <FiInfo />
              Apunta la cámara hacia el código QR
              proporcionado por el docente.
            </p>

            <div
              id="hu12-lector-qr"
              style={{
                width: "100%",
                maxWidth: "420px",
                margin: "16px auto"
              }}
            />

            <div className="hu12-acciones-estudiante">
              <button
                type="button"
                className="hu12-boton-secundario"
                onClick={cerrarCamara}
              >
                <FiX /> Cerrar cámara
              </button>
            </div>
          </div>
        )}

        <p className="hu12-ayuda">
          <FiInfo />
          El código debe estar vigente y solo puedes
          inscribirte una vez en la misma materia.
        </p>

        {procesando && resultado === null && (
          <p className="hu12-ayuda" role="status">
            <FiInfo />
            Procesando solicitud, por favor espera...
          </p>
        )}

        {vistaPrevia !== null && resultado === null && (
          <section className="hu12-tarjeta">
            <div className="hu12-tarjeta-titulo">
              <h2>
                <FiBookOpen /> Datos de la materia
              </h2>

              <p>
                Revisa la información antes de confirmar.
              </p>
            </div>

            <p>
              <strong>Materia:</strong>{" "}
              {vistaPrevia.datos.nombreAsignatura}
            </p>

            <p>
              <strong>Grupo:</strong>{" "}
              {vistaPrevia.datos.grupo || "No asignado"}
            </p>

            <p>
              <strong>Estado del QR:</strong>{" "}
              {vistaPrevia.datos.estado}
            </p>

            <p>
              <strong>Válido hasta:</strong>{" "}
              {obtenerFechaFormateada(
                vistaPrevia.datos.fechaExpiracion
              )}
            </p>

            <p className="hu12-ayuda">
              <FiInfo />
              Tu inscripción solo se registrará cuando
              presiones Confirmar inscripción.
            </p>

            <div className="hu12-acciones-estudiante">
              <button
                type="button"
                className="hu12-boton-principal"
                onClick={confirmarInscripcion}
                disabled={
                  procesando ||
                  !esEstudiante ||
                  camaraAbierta
                }
              >
                <FiCheckCircle />

                {procesando
                  ? "Inscribiendo..."
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
        )}

        {vistaPrevia === null && resultado === null && (
          <div className="hu12-acciones-estudiante">
            <Link
              to="/"
              className="hu12-boton-secundario"
            >
              Cancelar
            </Link>
          </div>
        )}
      </section>

      {resultado !== null && (
        <section className="hu12-tarjeta">
          <div className="hu12-resultado-titulo">
            <FiCheckCircle />
            <h2>Inscripción registrada</h2>
          </div>

          {resultado.nombreAsignatura && (
            <p>
              <strong>Materia:</strong>{" "}
              {resultado.nombreAsignatura}
            </p>
          )}

          {resultado.grupo && (
            <p>
              <strong>Grupo:</strong>{" "}
              {resultado.grupo}
            </p>
          )}

          <p>
            <strong>Estado:</strong> Inscrito
          </p>

          <div className="hu12-acciones-estudiante">
            <Link
              to="/"
              className="hu12-boton-secundario"
            >
              Volver al inicio
            </Link>
          </div>
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
                : "No se pudo completar la operación"}
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