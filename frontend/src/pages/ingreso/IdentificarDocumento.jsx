import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiSearch,
  FiUser,
  FiX,
} from "react-icons/fi";
import { useAuth } from "../../context/useAuth";
import {
  identificarEstudiantePorDocumentoSinExamen,
  obtenerFotoEstudiantePorDocumento,
} from "../../services/validacionHabilitacionService";
import "./IdentificarDocumento.css";

const PATRON_DOCUMENTO = /^[0-9]+(?:-[A-Za-z0-9]{1,2})?$/;
const LONGITUD_MAXIMA = 30;

function IdentificarDocumento() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const esDocente = usuario?.nombreRol?.trim().toUpperCase() === "DOCENTE";

  const [documento, setDocumento] = useState("");
  const [identificado, setIdentificado] = useState(null);
  const [error, setError] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [cargandoFoto, setCargandoFoto] = useState(false);
  const [fotoUrl, setFotoUrl] = useState(null);

  const solicitudActual = useRef(0);
  const buscandoActual = useRef(false);
  const fotoUrlActual = useRef(null);

  useEffect(() => {
    return () => {
      solicitudActual.current += 1;
      if (fotoUrlActual.current) {
        URL.revokeObjectURL(fotoUrlActual.current);
        fotoUrlActual.current = null;
      }
    };
  }, []);

  const limpiarIdentificacion = () => {
    solicitudActual.current += 1;
    buscandoActual.current = false;

    if (fotoUrlActual.current) {
      URL.revokeObjectURL(fotoUrlActual.current);
      fotoUrlActual.current = null;
    }

    setIdentificado(null);
    setFotoUrl(null);
    setError("");
    setBuscando(false);
    setCargandoFoto(false);
  };

  const cambiarDocumento = (valor) => {
    setDocumento(valor);
    limpiarIdentificacion();
  };

  const buscarOtro = () => {
    setDocumento("");
    limpiarIdentificacion();
  };

  const cargarFotografia = async (datos, documentoConsultado, solicitud) => {
    setCargandoFoto(true);

    try {
      const imagen = await obtenerFotoEstudiantePorDocumento(
        datos.idEstudiante,
        documentoConsultado,
      );

      if (solicitud !== solicitudActual.current) {
        return;
      }

      if (!imagen.type.startsWith("image/")) {
        return;
      }

      const nuevaUrl = URL.createObjectURL(imagen);
      fotoUrlActual.current = nuevaUrl;
      setFotoUrl(nuevaUrl);
    } catch {
      if (solicitud === solicitudActual.current) {
        setFotoUrl(null);
      }
    } finally {
      if (solicitud === solicitudActual.current) {
        setCargandoFoto(false);
      }
    }
  };

  const buscarEstudiante = async (evento) => {
    evento.preventDefault();

    if (buscandoActual.current) {
      return;
    }

    limpiarIdentificacion();

    const documentoLimpio = documento.trim();

    if (!documentoLimpio) {
      setError("Debe ingresar un documento de identidad.");
      return;
    }

    if (documentoLimpio.length > LONGITUD_MAXIMA) {
      setError(
        `El documento no puede superar los ${LONGITUD_MAXIMA} caracteres.`,
      );
      return;
    }

    if (!PATRON_DOCUMENTO.test(documentoLimpio)) {
      setError(
        "Formato de documento inválido. Ingrese números o un documento con complemento válido.",
      );
      return;
    }

    const solicitud = ++solicitudActual.current;
    buscandoActual.current = true;
    setBuscando(true);

    try {
      const datos =
        await identificarEstudiantePorDocumentoSinExamen(documentoLimpio);

      if (solicitud !== solicitudActual.current) {
        return;
      }

      setIdentificado(datos);

      if (datos.tieneFoto) {
        void cargarFotografia(datos, documentoLimpio, solicitud);
      }
    } catch (err) {
      if (solicitud !== solicitudActual.current) {
        return;
      }

      if (err.response?.status === 404) {
        setError("No se encontró un estudiante con ese documento.");
      } else if (err.response?.status === 409) {
        setError("Existen registros duplicados para ese documento.");
      } else if (err.response?.status === 403) {
        setError("No tiene permisos para identificar estudiantes.");
      } else if (err.response?.status === 401) {
        setError("Su sesión ha expirado. Vuelva a iniciar sesión.");
      } else if (!err.response) {
        setError("Error de conexión. No se pudo consultar al estudiante.");
      } else {
        setError(
          err.response?.data?.mensaje ||
            err.response?.data?.message ||
            err.response?.data?.detail ||
            "No se pudo identificar al estudiante.",
        );
      }
    } finally {
      if (solicitud === solicitudActual.current) {
        buscandoActual.current = false;
        setBuscando(false);
      }
    }
  };

  return (
    <main className="identificacion-pagina">
      <header className="identificacion-encabezado">
        <h1>Búsqueda por documento de identidad</h1>
        <p>Identifique al estudiante mediante su documento de identidad.</p>
      </header>

      <section className="identificacion-panel" aria-label="Buscar estudiante">
        <form
          className="identificacion-formulario"
          onSubmit={buscarEstudiante}
          noValidate
        >
          <div className="identificacion-campo">
            <label htmlFor="identificacion-documento">
              Documento de identidad
            </label>
            <div className="identificacion-entrada">
              <FiSearch aria-hidden="true" />
              <input
                id="identificacion-documento"
                type="text"
                value={documento}
                onChange={(evento) => cambiarDocumento(evento.target.value)}
                placeholder="Ej. 12345678 o 12345678-1A"
                autoComplete="off"
                aria-invalid={Boolean(error)}
                aria-describedby={
                  error ? "identificacion-mensaje-error" : undefined
                }
              />
              {documento && (
                <button
                  type="button"
                  className="identificacion-limpiar-entrada"
                  onClick={buscarOtro}
                  aria-label="Limpiar documento"
                  title="Limpiar documento"
                >
                  <FiX aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          <div className="identificacion-botones">
            <button
              type="submit"
              className="identificacion-boton identificacion-primario"
              disabled={buscando}
            >
              <FiSearch aria-hidden="true" />
              {buscando ? "Buscando..." : "Buscar estudiante"}
            </button>

            {esDocente && (
              <button
                type="button"
                className="identificacion-boton identificacion-secundario"
                onClick={() => navigate("/ingreso/identificar-codigo")}
              >
                Usar otro método
              </button>
            )}
          </div>
        </form>
      </section>

      {buscando && (
        <div className="identificacion-cargando" role="status">
          <span className="identificacion-indicador" aria-hidden="true" />
          Buscando al estudiante...
        </div>
      )}

      {error && (
        <div
          id="identificacion-mensaje-error"
          className="identificacion-alerta identificacion-error"
          role="alert"
        >
          <FiAlertCircle aria-hidden="true" />
          <div>
            <strong>No se pudo identificar al estudiante.</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {!identificado && !error && !buscando && (
        <section className="identificacion-inicial">
          <FiSearch aria-hidden="true" />
          <p>
            Ingrese el documento de identidad y seleccione «Buscar estudiante»
            para visualizar su perfil.
          </p>
        </section>
      )}

      {identificado && (
        <>
          <div
            className="identificacion-alerta identificacion-exito"
            role="status"
          >
            <FiCheckCircle aria-hidden="true" />
            <div>
              <strong>Estudiante identificado correctamente.</strong>
              <p>
                Se encontró un estudiante que coincide con el documento
                ingresado.
              </p>
            </div>
          </div>

          <section className="identificacion-perfil">
            <h2>Perfil del estudiante</h2>

            <div className="identificacion-perfil-contenido">
              <div className="identificacion-fotografia">
                {fotoUrl ? (
                  <img
                    src={fotoUrl}
                    alt={`Fotografía de ${identificado.nombreEstudiante}`}
                  />
                ) : (
                  <FiUser aria-hidden="true" />
                )}
                {cargandoFoto && (
                  <span className="identificacion-foto-cargando">
                    Cargando fotografía...
                  </span>
                )}
              </div>

              <dl className="identificacion-perfil-datos">
                <div className="identificacion-detalle">
                  <dt>Nombre:</dt>
                  <dd>{identificado.nombreEstudiante}</dd>
                </div>
                <div className="identificacion-detalle">
                  <dt>Carnet:</dt>
                  <dd>{identificado.documentoIdentidad}</dd>
                </div>
                <div className="identificacion-detalle">
                  <dt>Teléfono:</dt>
                  <dd>{identificado.telefono || "No registrado"}</dd>
                </div>
                <div className="identificacion-detalle">
                  <dt>Código SIS:</dt>
                  <dd>{identificado.codigoUniversitario || "No registrado"}</dd>
                </div>
              </dl>
            </div>
          </section>

          <div className="identificacion-acciones">
            <button
              type="button"
              className="identificacion-boton identificacion-secundario"
              onClick={buscarOtro}
            >
              Buscar otro estudiante
            </button>
            <button
              type="button"
              className="identificacion-boton identificacion-primario"
              onClick={() =>
                navigate("/ingreso/validar-estado-documento", {
                  state: {
                    identificacionEstudiante: {
                      idEstudiante: identificado.idEstudiante,
                      nombreEstudiante: identificado.nombreEstudiante,
                      documentoIdentidad: identificado.documentoIdentidad,
                      codigoUniversitario: identificado.codigoUniversitario,
                    },
                  },
                })
              }
            >
              Validar estado
            </button>
          </div>
        </>
      )}
    </main>
  );
}

export default IdentificarDocumento;
