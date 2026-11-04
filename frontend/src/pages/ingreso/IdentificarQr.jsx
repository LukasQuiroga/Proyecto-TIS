import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";

import {
  identificarEstudiantePorQr,
  obtenerExamenesIngreso,
  obtenerFotoEstudianteIdentificado,
} from "../../services/validacionHabilitacionService";

import ResultadoHabilitacion from "./ResultadoHabilitacion";

import "./IdentificarDocumento.css";
import "./IdentificarQr.css";

const LONGITUD_MAXIMA_TOKEN = 8192;

function obtenerMensajeError(error) {
  const estado = error.response?.status;

  if (!error.response) {
    return "Error de conexión. No se pudo consultar al estudiante.";
  }

  if (estado === 400) {
    return "El código QR es inválido, está dañado o tiene un formato incorrecto.";
  }

  if (estado === 403) {
    return "No tiene permisos para identificar estudiantes en este examen.";
  }

  if (estado === 404) {
    return "No se encontró un código QR válido para el examen seleccionado.";
  }

  if (estado === 409) {
    return "El código QR no puede utilizarse. Puede estar revocado o no corresponder al examen.";
  }

  return (
    error.response?.data?.mensaje ||
    error.response?.data?.message ||
    error.response?.data?.detail ||
    "No se pudo identificar al estudiante."
  );
}

function IdentificarQr() {
  const navigate = useNavigate();

  const [examenes, setExamenes] = useState([]);
  const [idExamen, setIdExamen] = useState("");
  const [cargandoExamenes, setCargandoExamenes] = useState(true);
  const [camaraAbierta, setCamaraAbierta] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [identificado, setIdentificado] = useState(null);
  const [mostrarValidacion, setMostrarValidacion] = useState(false);
  const [error, setError] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");

  const solicitudActual = useRef(0);
  const lecturaRealizada = useRef(false);
  const fotoUrlActual = useRef("");
  const examenActual = useRef("");

  useEffect(() => {
    let activo = true;

    obtenerExamenesIngreso()
      .then((datos) => {
        if (activo) {
          setExamenes(datos);
        }
      })
      .catch(() => {
        if (activo) {
          setError("No se pudo cargar la lista de exámenes.");
        }
      })
      .finally(() => {
        if (activo) {
          setCargandoExamenes(false);
        }
      });

    return () => {
      activo = false;
      solicitudActual.current += 1;

      if (fotoUrlActual.current) {
        URL.revokeObjectURL(fotoUrlActual.current);
        fotoUrlActual.current = "";
      }
    };
  }, []);

  const limpiarIdentificacion = () => {
    solicitudActual.current += 1;

    if (fotoUrlActual.current) {
      URL.revokeObjectURL(fotoUrlActual.current);
      fotoUrlActual.current = "";
    }

    setFotoUrl("");
    setIdentificado(null);
    setMostrarValidacion(false);
    setError("");
    setBuscando(false);
  };

  const cambiarExamen = (valor) => {
    examenActual.current = valor;
    setCamaraAbierta(false);
    setIdExamen(valor);
    limpiarIdentificacion();
  };

  const procesarToken = useCallback(
    async (contenido) => {
      if (!idExamen || examenActual.current !== idExamen) {
        return;
      }

      const token = typeof contenido === "string" ? contenido.trim() : "";
      const solicitud = ++solicitudActual.current;

      setIdentificado(null);
      setMostrarValidacion(false);
      setError("");
      setFotoUrl("");

      if (fotoUrlActual.current) {
        URL.revokeObjectURL(fotoUrlActual.current);
        fotoUrlActual.current = "";
      }

      if (!token || token.length > LONGITUD_MAXIMA_TOKEN) {
        setError("El código QR está vacío o supera la longitud permitida.");
        return;
      }

      setBuscando(true);

      try {
        const datos = await identificarEstudiantePorQr(Number(idExamen), token);

        if (solicitud !== solicitudActual.current) {
          return;
        }

        if (
          !datos ||
          Number(datos.idExamen) !== Number(idExamen) ||
          !Number.isSafeInteger(Number(datos.idEstudiante)) ||
          Number(datos.idEstudiante) <= 0 ||
          !String(datos.nombreEstudiante ?? "").trim() ||
          typeof datos.asociadoAlExamen !== "boolean"
        ) {
          setError(
            "El servidor devolvió información incompleta o inconsistente.",
          );
          return;
        }

        setIdentificado(datos);

        if (datos.tieneFoto && datos.asociadoAlExamen) {
          try {
            const foto = await obtenerFotoEstudianteIdentificado(
              Number(idExamen),
              datos.idEstudiante,
            );

            if (solicitud !== solicitudActual.current) {
              return;
            }

            const url = URL.createObjectURL(foto);
            fotoUrlActual.current = url;
            setFotoUrl(url);
          } catch {
            if (solicitud === solicitudActual.current) {
              setFotoUrl("");
            }
          }
        }
      } catch (errorSolicitud) {
        if (solicitud !== solicitudActual.current) {
          return;
        }

        setError(obtenerMensajeError(errorSolicitud));
      } finally {
        if (solicitud === solicitudActual.current) {
          setBuscando(false);
        }
      }
    },
    [idExamen],
  );

  useEffect(() => {
    if (!camaraAbierta) {
      return;
    }

    let cancelado = false;
    let scanner = null;
    let iniciado = false;

    const iniciarCamara = async () => {
      try {
        scanner = new Html5Qrcode("identificacion-lector-qr", {
          verbose: false,
        });

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10 },
          (textoEscaneado) => {
            if (cancelado || lecturaRealizada.current) {
              return;
            }

            lecturaRealizada.current = true;
            setCamaraAbierta(false);
            void procesarToken(textoEscaneado);
          },
          () => {},
        );

        iniciado = true;

        if (cancelado) {
          await scanner.stop();
          iniciado = false;
          await scanner.clear();
        }
      } catch {
        if (!cancelado) {
          setCamaraAbierta(false);
          setError(
            "No se pudo iniciar la cámara. Verifique los permisos del navegador y utilice HTTPS o localhost.",
          );
        }
      }
    };

    void iniciarCamara();

    return () => {
      cancelado = true;

      if (scanner && iniciado) {
        void scanner
          .stop()
          .catch(() => {})
          .finally(() => {
            void scanner.clear().catch(() => {});
          });
      }
    };
  }, [camaraAbierta, procesarToken]);

  const abrirCamara = () => {
    if (!idExamen) {
      setError("Debe seleccionar un examen antes de escanear.");
      return;
    }

    if (buscando || camaraAbierta) {
      return;
    }

    limpiarIdentificacion();
    lecturaRealizada.current = false;
    setCamaraAbierta(true);
  };

  const cerrarCamara = () => {
    setCamaraAbierta(false);
  };

  const buscarOtro = () => {
    setCamaraAbierta(false);
    limpiarIdentificacion();
    lecturaRealizada.current = false;
  };

  const continuarValidacion = () => {
    if (
      !identificado?.asociadoAlExamen ||
      !idExamen ||
      buscando ||
      camaraAbierta
    ) {
      return;
    }

    setMostrarValidacion(true);
  };

  const examenSeleccionado = examenes.find(
    (examen) => String(examen.idExamen) === String(idExamen),
  );

  return (
    <main className="identificacion-pagina">
      <header className="identificacion-encabezado">
        <h1>Identificación de estudiante mediante QR</h1>
        <p>
          Seleccione un examen y escanee el código QR del estudiante para
          consultar su información.
        </p>
      </header>

      <section className="identificacion-panel">
        <h2>Escanear código QR</h2>

        <div className="identificacion-formulario">
          <div className="identificacion-campo">
            <label htmlFor="identificacion-qr-examen">Examen</label>

            <select
              id="identificacion-qr-examen"
              value={idExamen}
              onChange={(evento) => cambiarExamen(evento.target.value)}
              disabled={cargandoExamenes || buscando}
            >
              <option value="">
                {cargandoExamenes
                  ? "Cargando exámenes..."
                  : "Seleccione un examen"}
              </option>

              {examenes.map((examen) => (
                <option key={examen.idExamen} value={examen.idExamen}>
                  {examen.codigo || `Examen ${examen.idExamen}`}
                  {" - "}
                  {examen.nombreExamen}
                </option>
              ))}
            </select>
          </div>

          <div className="identificacion-botones">
            <button
              type="button"
              className="identificacion-boton identificacion-primario"
              onClick={abrirCamara}
              disabled={cargandoExamenes || buscando || camaraAbierta}
            >
              {camaraAbierta ? "Cámara activa" : "Escanear QR"}
            </button>

            {camaraAbierta && (
              <button
                type="button"
                className="identificacion-boton identificacion-secundario"
                onClick={cerrarCamara}
              >
                Cerrar cámara
              </button>
            )}

            <button
              type="button"
              className="identificacion-boton identificacion-secundario"
              onClick={buscarOtro}
            >
              Limpiar
            </button>
          </div>
        </div>

        {camaraAbierta && (
          <div className="identificacion-qr-camara">
            <p>Apunte la cámara hacia el código QR del estudiante.</p>

            <div
              id="identificacion-lector-qr"
              className="identificacion-qr-lector"
            />
          </div>
        )}

        <p className="identificacion-qr-ayuda">
          Si no puede utilizar la cámara o el QR está dañado, identifique al
          estudiante mediante otro método.
        </p>

        <div className="identificacion-botones">
          <button
            type="button"
            className="identificacion-boton identificacion-secundario"
            onClick={() => navigate("/ingreso/identificar-documento")}
          >
            Usar documento de identidad
          </button>

          <button
            type="button"
            className="identificacion-boton identificacion-secundario"
            onClick={() => navigate("/ingreso/identificar-codigo")}
          >
            Usar código universitario
          </button>
        </div>
      </section>

      {buscando && (
        <div className="identificacion-nota" role="status">
          Consultando la información del estudiante...
        </div>
      )}

      {error && (
        <div
          className="identificacion-alerta identificacion-error"
          role="alert"
        >
          <strong>No se pudo identificar al estudiante.</strong>
          <p>{error}</p>
        </div>
      )}

      {identificado && (
        <>
          <div
            className="identificacion-alerta identificacion-exito"
            role="status"
          >
            <strong>Estudiante identificado correctamente.</strong>
            <p>Se encontró la información asociada al código QR escaneado.</p>
          </div>

          <section className="identificacion-tarjeta identificacion-qr-perfil">
            <div className="identificacion-qr-fotografia">
              {fotoUrl ? (
                <img
                  src={fotoUrl}
                  alt="Fotografía del estudiante identificado"
                />
              ) : (
                <span>
                  {identificado.tieneFoto
                    ? "Foto no disponible"
                    : "Sin fotografía"}
                </span>
              )}
            </div>

            <div className="identificacion-qr-informacion">
              <h2>Información del estudiante</h2>

              <div className="identificacion-detalle">
                <strong>Nombre:</strong>
                <span>{identificado.nombreEstudiante}</span>
              </div>

              <div className="identificacion-detalle">
                <strong>Documento de identidad:</strong>
                <span>
                  {identificado.documentoIdentidad || "No registrado"}
                </span>
              </div>

              <div className="identificacion-detalle">
                <strong>Código universitario:</strong>
                <span>
                  {identificado.codigoUniversitario || "No registrado"}
                </span>
              </div>

              <div className="identificacion-detalle">
                <strong>Teléfono:</strong>
                <span>{identificado.telefono || "No registrado"}</span>
              </div>

              <div className="identificacion-detalle">
                <strong>Examen:</strong>
                <span>{examenSeleccionado?.nombreExamen || idExamen}</span>
              </div>
            </div>
          </section>

          {identificado.asociadoAlExamen ? (
            <div className="identificacion-nota">
              <strong>El estudiante ha sido identificado.</strong>
              <p>
                Puede continuar con la validación de habilitación. La
                identificación mediante QR no autoriza automáticamente su
                ingreso.
              </p>
            </div>
          ) : (
            <div className="identificacion-nota identificacion-aviso">
              <strong>El estudiante no está asociado a este examen.</strong>
              <p>
                No puede continuar con la validación para el examen
                seleccionado.
              </p>
            </div>
          )}

          <div className="identificacion-acciones">
            <button
              type="button"
              className="identificacion-boton identificacion-secundario"
              onClick={abrirCamara}
              disabled={buscando || camaraAbierta}
            >
              Identificar otro estudiante
            </button>

            <button
              type="button"
              className="identificacion-boton identificacion-primario"
              onClick={continuarValidacion}
              disabled={!identificado.asociadoAlExamen || buscando}
            >
              Continuar validación
            </button>
          </div>

          {mostrarValidacion && identificado.asociadoAlExamen && (
            <ResultadoHabilitacion
              key={`${idExamen}-${identificado.idEstudiante}`}
              idExamen={Number(idExamen)}
              idEstudiante={identificado.idEstudiante}
              nombreExamen={examenSeleccionado?.nombreExamen}
              nombreEstudiante={identificado.nombreEstudiante}
            />
          )}
        </>
      )}
    </main>
  );
}

export default IdentificarQr;
