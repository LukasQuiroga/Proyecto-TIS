
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  identificarEstudiantePorCodigo,
  obtenerExamenesIngreso,
} from "../../services/validacionHabilitacionService";

import "./IdentificarDocumento.css";

const PATRON_CODIGO = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/;
const LONGITUD_MAXIMA = 30;

function IdentificarCodigo() {
  const navigate = useNavigate();

  const [examenes, setExamenes] = useState([]);
  const [idExamen, setIdExamen] = useState("");
  const [codigo, setCodigo] = useState("");
  const [identificado, setIdentificado] = useState(null);
  const [error, setError] = useState("");

  const [cargandoExamenes, setCargandoExamenes] = useState(true);
  const [buscando, setBuscando] = useState(false);

  const solicitudActual = useRef(0);

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
    };
  }, []);

  const limpiarIdentificacion = () => {
    solicitudActual.current += 1;
    setIdentificado(null);
    setError("");
    setBuscando(false);
  };

  const cambiarExamen = (valor) => {
    setIdExamen(valor);
    limpiarIdentificacion();
  };

  const cambiarCodigo = (valor) => {
    setCodigo(valor);
    limpiarIdentificacion();
  };

  const buscarEstudiante = async (evento) => {
    evento.preventDefault();

    limpiarIdentificacion();

    const codigoLimpio = codigo.trim();

    if (!idExamen) {
      setError("Debe seleccionar un examen.");
      return;
    }

    if (!codigoLimpio) {
      setError("Debe ingresar un código universitario.");
      return;
    }

    if (codigoLimpio.length > LONGITUD_MAXIMA) {
      setError(
        `El código universitario no puede superar los ${LONGITUD_MAXIMA} caracteres.`,
      );
      return;
    }

    if (!PATRON_CODIGO.test(codigoLimpio)) {
      setError("El código universitario tiene un formato inválido.");
      return;
    }

    const solicitud = ++solicitudActual.current;

    setBuscando(true);

    try {
      const datos = await identificarEstudiantePorCodigo(
        Number(idExamen),
        codigoLimpio,
      );

      if (solicitud !== solicitudActual.current) {
        return;
      }

      if (
        !datos ||
        !Number.isInteger(Number(datos.idEstudiante)) ||
        Number(datos.idEstudiante) <= 0 ||
        String(datos.codigoUniversitario ?? "")
          .trim()
          .toUpperCase() !== codigoLimpio.toUpperCase() ||
        !String(datos.nombreEstudiante ?? "").trim() ||
        Number(datos.idExamen) !== Number(idExamen) ||
        typeof datos.asociadoAlExamen !== "boolean"
      ) {
        setError(
          "El servidor devolvió información incompleta o inconsistente.",
        );
        return;
      }

      setIdentificado(datos);
    } catch (err) {
      if (solicitud !== solicitudActual.current) {
        return;
      }

      if (err.response?.status === 404) {
        setError(
          "No se encontró un estudiante con ese código universitario.",
        );
      } else if (err.response?.status === 403) {
        setError("No tiene permisos para identificar estudiantes.");
      } else if (err.response?.status === 409) {
        setError(
          "Existen registros duplicados para ese código universitario.",
        );
      } else if (!err.response) {
        setError(
          "Error de conexión. No se pudo consultar al estudiante.",
        );
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
        setBuscando(false);
      }
    }
  };

  const continuarValidacion = () => {
    if (
      !identificado?.asociadoAlExamen ||
      !Number.isInteger(Number(identificado.idEstudiante)) ||
      Number(identificado.idEstudiante) <= 0 ||
      Number(identificado.idExamen) !== Number(idExamen)
    ) {
      return;
    }

    navigate("/ingreso/validar-habilitacion", {
      state: {
        identificacionEstudiante: {
          idExamen: Number(idExamen),
          idEstudiante: identificado.idEstudiante,
        },
      },
    });
  };

  const buscarOtro = () => {
    setCodigo("");
    limpiarIdentificacion();
  };

  const examenSeleccionado = examenes.find(
    (examen) => String(examen.idExamen) === String(idExamen),
  );

  return (
    <main className="identificacion-pagina">
      <header className="identificacion-encabezado">
        <h1>Búsqueda por código universitario</h1>
        <p>
          Identifique a un estudiante ingresando su código universitario.
        </p>
      </header>

      <section className="identificacion-panel">
        <h2>Identificar estudiante</h2>

        <form
          className="identificacion-formulario"
          onSubmit={buscarEstudiante}
          noValidate
        >
          <div className="identificacion-campo">
            <label htmlFor="identificacion-codigo-examen">
              Examen
            </label>

            <select
              id="identificacion-codigo-examen"
              value={idExamen}
              onChange={(e) => cambiarExamen(e.target.value)}
              disabled={cargandoExamenes}
            >
              <option value="">
                {cargandoExamenes
                  ? "Cargando exámenes..."
                  : "Seleccione un examen"}
              </option>

              {examenes.map((examen) => (
                <option
                  key={examen.idExamen}
                  value={examen.idExamen}
                >
                  {examen.codigo || `Examen ${examen.idExamen}`}
                  {" - "}
                  {examen.nombreExamen}
                </option>
              ))}
            </select>
          </div>

          <div className="identificacion-campo">
            <label htmlFor="identificacion-codigo">
              Código universitario
            </label>

            <input
              id="identificacion-codigo"
              type="text"
              value={codigo}
              onChange={(e) => cambiarCodigo(e.target.value)}
              placeholder="Ej. 202012345"
              autoComplete="off"
              maxLength={LONGITUD_MAXIMA + 1}
            />
          </div>

          <div className="identificacion-botones">
            <button
              type="submit"
              className="identificacion-boton identificacion-primario"
              disabled={buscando || cargandoExamenes}
            >
              {buscando ? "Buscando..." : "Buscar estudiante"}
            </button>

            <button
              type="button"
              className="identificacion-boton identificacion-secundario"
              onClick={buscarOtro}
            >
              Limpiar
            </button>

            <button
              type="button"
              className="identificacion-boton identificacion-secundario"
              onClick={() =>
                navigate("/ingreso/validar-habilitacion")
              }
            >
              Usar otro método
            </button>
          </div>
        </form>
      </section>

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
            <p>
              Se encontró un estudiante que coincide con el código
              universitario ingresado.
            </p>
          </div>

          <div className="identificacion-datos">
            <section className="identificacion-tarjeta">
              <h2>Información del estudiante</h2>

              <div className="identificacion-detalle">
                <strong>Nombre:</strong>
                <span>{identificado.nombreEstudiante}</span>
              </div>

              <div className="identificacion-detalle">
                <strong>Código universitario:</strong>
                <span>
                  {identificado.codigoUniversitario || "No registrado"}
                </span>
              </div>

              <div className="identificacion-detalle">
                <strong>Documento de identidad:</strong>
                <span>{identificado.documentoIdentidad}</span>
              </div>
            </section>

            <section className="identificacion-tarjeta">
              <h2>Información del examen</h2>

              <div className="identificacion-detalle">
                <strong>Examen:</strong>
                <span>
                  {examenSeleccionado?.nombreExamen ||
                    identificado.idExamen}
                </span>
              </div>

              <div className="identificacion-detalle">
                <strong>Materia:</strong>
                <span>
                  {examenSeleccionado?.materia || "No disponible"}
                </span>
              </div>

              <div className="identificacion-detalle">
                <strong>Estado:</strong>
                <span className="identificacion-pendiente">
                  Pendiente de validación
                </span>
              </div>
            </section>
          </div>

          {identificado.asociadoAlExamen ? (
            <div className="identificacion-nota">
              <strong>El estudiante ha sido identificado.</strong>
              <p>
                Puede continuar con la validación de habilitación.
                La identificación no autoriza automáticamente el ingreso.
              </p>
            </div>
          ) : (
            <div className="identificacion-nota identificacion-aviso">
              <strong>
                El estudiante no está asociado a este examen.
              </strong>
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
              onClick={buscarOtro}
            >
              Buscar otro estudiante
            </button>

            <button
              type="button"
              className="identificacion-boton identificacion-primario"
              onClick={continuarValidacion}
              disabled={!identificado.asociadoAlExamen}
            >
              Continuar validación
            </button>
          </div>
        </>
      )}
    </main>
  );
}

export default IdentificarCodigo;
