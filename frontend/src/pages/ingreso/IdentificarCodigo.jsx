import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  identificarEstudiantePorCodigo,
  obtenerExamenesIngreso,
  obtenerFotoEstudianteIdentificado,
} from "../../services/validacionHabilitacionService";

import ResultadoHabilitacion from "./ResultadoHabilitacion";
import "./IdentificarDocumento.css";
import "./IdentificarCodigo.css";

const PATRON_CODIGO = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/;
const LONGITUD_MAXIMA = 30;

function IdentificarCodigo() {
  const navigate = useNavigate();

  const [examenes, setExamenes] = useState([]);
  const [idExamen, setIdExamen] = useState("");
  const [codigo, setCodigo] = useState("");
  const [identificado, setIdentificado] = useState(null);
  const [error, setError] = useState("");
  const [mostrarValidacion, setMostrarValidacion] = useState(false);

  const [cargandoExamenes, setCargandoExamenes] = useState(true);
  const [buscando, setBuscando] = useState(false);
  const [fotoUrl, setFotoUrl] = useState("");
  const fotoUrlActual = useRef("");

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
          setError("No se pudo cargar la lista de examenes.");
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
      if (fotoUrlActual.current) URL.revokeObjectURL(fotoUrlActual.current);
    };
  }, []);

  const limpiarIdentificacion = () => {
    solicitudActual.current += 1;
    setMostrarValidacion(false);
    if (fotoUrlActual.current) {
      URL.revokeObjectURL(fotoUrlActual.current);
      fotoUrlActual.current = "";
    }
    setFotoUrl("");
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
      setError("Debe ingresar un codigo universitario.");
      return;
    }

    if (codigoLimpio.length > LONGITUD_MAXIMA) {
      setError(
        `El codigo universitario no puede superar los ${LONGITUD_MAXIMA} caracteres.`,
      );
      return;
    }

    if (!PATRON_CODIGO.test(codigoLimpio)) {
      setError("El codigo universitario tiene un formato invalido.");
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
        String(datos.codigoUniversitario ?? "").trim().toUpperCase() !== codigoLimpio.toUpperCase() ||
        !String(datos.nombreEstudiante ?? "").trim() ||
        Number(datos.idExamen) !== Number(idExamen) ||
        typeof datos.asociadoAlExamen !== "boolean"
      ) {
        setError("El servidor devolvió información incompleta o inconsistente.");
        return;
      }

      setIdentificado(datos);
      if (datos.tieneFoto && datos.asociadoAlExamen) {
        try {
          const foto = await obtenerFotoEstudianteIdentificado(Number(idExamen), datos.idEstudiante);
          if (solicitud !== solicitudActual.current) return;
          const url = URL.createObjectURL(foto);
          fotoUrlActual.current = url;
          setFotoUrl(url);
        } catch {
          if (solicitud !== solicitudActual.current) return;
          setFotoUrl("");
        }
      }
    } catch (err) {
      if (solicitud !== solicitudActual.current) {
        return;
      }

      if (err.response?.status === 404) {
        setError("No se encontro un estudiante con ese codigo universitario.");
      } else if (err.response?.status === 403) {
        setError("No tiene permisos para identificar estudiantes.");
      } else if (err.response?.status === 409) {
        setError("Existen registros duplicados para ese codigo universitario.");
      } else if (!err.response) {
        setError("Error de conexion. No se pudo consultar al estudiante.");
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
    if (!identificado?.asociadoAlExamen || !idExamen) {
      return;
    }
    setMostrarValidacion(true);
  };
    const buscarOtro = () => {
      setCodigo("");
      limpiarIdentificacion();
    };

  return (
    <main className="identificacion-pagina">
      <header className="identificacion-encabezado">
        <h1>Busqueda por codigo universitario</h1>
        <p>
          Identifique a un estudiante ingresando su codigo universitario.
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
                  ? "Cargando examenes..."
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
              Codigo universitario
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
              onClick={() => navigate("/ingreso/validar-habilitacion")}
            >
              Usar otro metodo
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
              Se encontro un estudiante que coincide con el codigo
              universitario ingresado.
            </p>
          </div>

          <section className="identificacion-tarjeta hu15-perfil">
            <div className="hu15-fotografia">
              {fotoUrl ? (
                <img src={fotoUrl} alt="Fotografía del estudiante identificado" />
              ) : (
                <span>{identificado.tieneFoto ? "Foto no disponible" : "Sin fotografía"}</span>
              )}
            </div>
            <div className="hu15-datos">
              <h2>Perfil del estudiante</h2>
              <div className="identificacion-detalle"><strong>Nombre:</strong><span>{identificado.nombreEstudiante}</span></div>
              <div className="identificacion-detalle"><strong>Carnet:</strong><span>{identificado.documentoIdentidad || "No registrado"}</span></div>
              <div className="identificacion-detalle"><strong>Teléfono:</strong><span>{identificado.telefono || "No registrado"}</span></div>
              <div className="identificacion-detalle"><strong>Código SIS:</strong><span>{identificado.codigoUniversitario}</span></div>
            </div>
          </section>

          {identificado.asociadoAlExamen ? (
            <div className="identificacion-nota">
              <strong>El estudiante ha sido identificado.</strong>
              <p>
                Puede continuar con la validacion de habilitacion.
                La identificacion no autoriza automaticamente el ingreso.
              </p>
            </div>
          ) : (
            <div className="identificacion-nota identificacion-aviso">
              <strong>
                El estudiante no esta asociado a este examen.
              </strong>
              <p>
                No puede continuar con la validacion para el examen
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
              Continuar validacion
            </button>
          </div>
          {mostrarValidacion && identificado.asociadoAlExamen && (
            <ResultadoHabilitacion
              idExamen={Number(idExamen)}
              idEstudiante={identificado.idEstudiante}
              nombreExamen={
                examenes.find(
                  (examen) => String(examen.idExamen) === String(idExamen),
                )?.nombreExamen
              }
              nombreEstudiante={identificado.nombreEstudiante}
            />
          )}
        </>
      )}
    </main>
  );
}

export default IdentificarCodigo;