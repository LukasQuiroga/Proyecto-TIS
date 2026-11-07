
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import EstudianteNoEncontrado from "./EstudianteNoEncontrado";

import {
  FiAlertCircle,
  FiCheckCircle,
  FiSearch,
  FiUser,
  FiX,
} from "react-icons/fi";

import {
  identificarEstudiantePorCodigoSinExamen,
  obtenerFotoEstudiantePorCodigo,
} from "../../services/validacionHabilitacionService";

import "./IdentificarDocumento.css";

const PATRON_CODIGO = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/;
const LONGITUD_MAXIMA = 30;

function IdentificarCodigo() {
  const navigate = useNavigate();

  const [codigo, setCodigo] = useState("");
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

  const cambiarCodigo = (valor) => {
    setCodigo(valor);
    limpiarIdentificacion();
  };

  const buscarOtro = () => {
    setCodigo("");
    limpiarIdentificacion();
  };

  const cargarFotografia = async (
    datos,
    codigoConsultado,
    solicitud
  ) => {
    setCargandoFoto(true);

    try {
      const imagen = await obtenerFotoEstudiantePorCodigo(
        datos.idEstudiante,
        codigoConsultado
      );

      if (solicitud !== solicitudActual.current) return;

      if (!imagen.type.startsWith("image/")) return;

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

    if (buscandoActual.current) return;

    limpiarIdentificacion();

    const codigoLimpio = codigo.trim();

    if (!codigoLimpio) {
      setError("Debe ingresar un código universitario.");
      return;
    }

    if (codigoLimpio.length > LONGITUD_MAXIMA) {
      setError(
        `El código universitario no puede superar los ${LONGITUD_MAXIMA} caracteres.`
      );
      return;
    }

    if (!PATRON_CODIGO.test(codigoLimpio)) {
      setError("El código universitario tiene un formato inválido.");
      return;
    }

    const solicitud = ++solicitudActual.current;

    buscandoActual.current = true;
    setBuscando(true);

    try {
      const datos =
        await identificarEstudiantePorCodigoSinExamen(
          codigoLimpio
        );

      if (solicitud !== solicitudActual.current) return;

      if (
        !datos ||
        !Number.isSafeInteger(Number(datos.idEstudiante)) ||
        Number(datos.idEstudiante) <= 0 ||
        String(datos.codigoUniversitario ?? "") !== codigoLimpio ||
        !String(datos.nombreEstudiante ?? "").trim()
      ) {
        setError(
          "El servidor devolvió información incompleta o inconsistente."
        );
        return;
      }

      setIdentificado(datos);

      if (datos.tieneFoto) {
        void cargarFotografia(
          datos,
          codigoLimpio,
          solicitud
        );
      }
    } catch (err) {
      if (solicitud !== solicitudActual.current) return;

      if (err.response?.status === 404) {
        setError("Estudiante no encontrado");
      } else if (err.response?.status === 409) {
        setError(
          "Existen registros duplicados para ese código universitario."
        );
      } else if (err.response?.status === 403) {
        setError(
          "No tiene permisos para identificar estudiantes."
        );
      } else if (err.response?.status === 401) {
        setError(
          "Su sesión ha expirado. Vuelva a iniciar sesión."
        );
      } else if (!err.response) {
        setError(
          "Error de conexión. No se pudo consultar al estudiante."
        );
      } else {
        setError(
          err.response?.data?.mensaje ||
          err.response?.data?.message ||
          "No se pudo identificar al estudiante."
        );
      }
    } finally {
      if (solicitud === solicitudActual.current) {
        buscandoActual.current = false;
        setBuscando(false);
      }
    }
  };

  
  const comprobarExamen = () => {
    if (
      !identificado ||
      !Number.isSafeInteger(Number(identificado.idEstudiante)) ||
      Number(identificado.idEstudiante) <= 0
    ) {
      return;
    }

    navigate("/ingreso/comprobar-examen", {
      state: {
        origenIdentificacion: "CODIGO",
        identificacionEstudiante: {
          idEstudiante: identificado.idEstudiante,
          nombreEstudiante: identificado.nombreEstudiante,
          documentoIdentidad: identificado.documentoIdentidad,
          codigoUniversitario: identificado.codigoUniversitario,
        },
      },
    });
  };


  return (
    <main className="identificacion-pagina">

      <header className="identificacion-encabezado">
        <h1>Búsqueda por código universitario</h1>
        <p>
          Identifique al estudiante mediante su código universitario.
        </p>
      </header>

      <section
        className="identificacion-panel"
        aria-label="Buscar estudiante"
      >
        <form
          className="identificacion-formulario"
          onSubmit={buscarEstudiante}
          noValidate
        >
          <div className="identificacion-campo">
            <label htmlFor="identificacion-codigo">
              Código universitario
            </label>

            <div className="identificacion-entrada">
              <FiSearch aria-hidden="true" />

              <input
                id="identificacion-codigo"
                type="text"
                value={codigo}
                onChange={(e) => cambiarCodigo(e.target.value)}
                placeholder="Ej. 202012345"
                autoComplete="off"
                maxLength={31}
                aria-invalid={Boolean(error)}
              />

              {codigo && (
                <button
                  type="button"
                  className="identificacion-limpiar-entrada"
                  onClick={buscarOtro}
                  aria-label="Limpiar código"
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

            <button
              type="button"
              className="identificacion-boton identificacion-secundario"
              onClick={() =>
                navigate("/ingreso/identificar-documento")
              }
            >
              Usar otro método
            </button>
          </div>
        </form>
      </section>

      {buscando && (
        <div className="identificacion-cargando" role="status">
          <span
            className="identificacion-indicador"
            aria-hidden="true"
          />
          Buscando al estudiante...
        </div>
      )}

      
     {error === "Estudiante no encontrado" ? (
       <EstudianteNoEncontrado
         codigoConsultado={codigo.trim()}
         onReintentar={buscarOtro}
       />
     ) : (
       error && (
         <div
           className="identificacion-alerta identificacion-error"
           role="alert"
         >
           <FiAlertCircle aria-hidden="true" />

           <div>
             <strong>No se pudo identificar al estudiante.</strong>
             <p>{error}</p>
           </div>
         </div>
       )
     )}


      {!identificado && !error && !buscando && (
        <section className="identificacion-inicial">
          <FiSearch aria-hidden="true" />
          <p>
            Ingrese el código universitario y seleccione
            «Buscar estudiante» para visualizar su perfil.
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
              <strong>
                Estudiante identificado correctamente.
              </strong>
              <p>
                Se encontró un estudiante que coincide con el
                código universitario ingresado.
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
                  <dd>
                    {identificado.documentoIdentidad ||
                      "No registrado"}
                  </dd>
                </div>

                <div className="identificacion-detalle">
                  <dt>Teléfono:</dt>
                  <dd>
                    {identificado.telefono || "No registrado"}
                  </dd>
                </div>

                <div className="identificacion-detalle">
                  <dt>Código SIS:</dt>
                  <dd>{identificado.codigoUniversitario}</dd>
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
              onClick={comprobarExamen}
            >
              Comprobar examen
            </button>
          </div>
        </>
      )}
    </main>
  );
}

export default IdentificarCodigo;
