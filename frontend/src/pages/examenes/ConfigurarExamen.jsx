import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiInfo, FiSave } from "react-icons/fi";

import {
  configurarExamen,
  obtenerExamenPorId,
  obtenerMensajeErrorExamen,
} from "../../services/examenService";

import { obtenerNombreAsignatura } from "./utilsExamen.js";

import "./ConfigurarExamen.css";

const CAMPOS_INICIALES = {
  fechaExamen: "",
  horaInicio: "",
  duracionMinutos: "",
};

function ConfigurarExamen() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [examen, setExamen] = useState(null);
  const [formulario, setFormulario] = useState(CAMPOS_INICIALES);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [exito, setExito] = useState("");

  useEffect(() => {
    let activo = true;

    const cargarExamen = async () => {
      try {
        const respuesta = await obtenerExamenPorId(id);
        const datos = respuesta.data;

        if (!activo) return;

        setExamen(datos);

        setFormulario({
          fechaExamen: datos.fechaExamen ?? "",
          horaInicio: datos.horaInicio
            ? String(datos.horaInicio).slice(0, 5)
            : "",
          duracionMinutos:
            datos.duracionMinutos != null ? String(datos.duracionMinutos) : "",
        });
      } catch (error) {
        if (activo) {
          setErrorGeneral(obtenerMensajeErrorExamen(error));
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    };

    cargarExamen();

    return () => {
      activo = false;
    };
  }, [id]);

  const cambiarCampo = (evento) => {
    const { name, value } = evento.target;

    setFormulario((actual) => ({
      ...actual,
      [name]: value,
    }));

    setErrores((actual) => ({
      ...actual,
      [name]: "",
    }));

    setErrorGeneral("");
    setExito("");
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!formulario.fechaExamen) {
      nuevosErrores.fechaExamen = "La fecha es obligatoria.";
    }

    if (!formulario.horaInicio) {
      nuevosErrores.horaInicio = "La hora es obligatoria.";
    }

    if (!formulario.duracionMinutos) {
      nuevosErrores.duracionMinutos = "La duración es obligatoria.";
    } else {
      const duracion = Number(formulario.duracionMinutos);

      if (!Number.isInteger(duracion) || duracion <= 0 || duracion >= 1440) {
        nuevosErrores.duracionMinutos =
          "La duración debe estar entre 1 y 1439 minutos.";
      }
    }

    return nuevosErrores;
  };

  const guardarConfiguracion = async (evento) => {
    evento.preventDefault();

    const nuevosErrores = validarFormulario();

    setErrores(nuevosErrores);
    setErrorGeneral("");
    setExito("");

    if (Object.keys(nuevosErrores).length > 0) {
      setErrorGeneral("Verifique los campos obligatorios y sus valores.");
      return;
    }

    setGuardando(true);

    try {
      const respuesta = await configurarExamen(id, {
        fechaExamen: formulario.fechaExamen,
        horaInicio: formulario.horaInicio,
        duracionMinutos: Number(formulario.duracionMinutos),
      });

      const datos = respuesta.data;

      setExamen(datos);

      setFormulario({
        fechaExamen: datos.fechaExamen ?? "",
        horaInicio: datos.horaInicio
          ? String(datos.horaInicio).slice(0, 5)
          : "",
        duracionMinutos:
          datos.duracionMinutos != null ? String(datos.duracionMinutos) : "",
      });

      setExito("Configuración actualizada correctamente.");
    } catch (error) {
      setErrorGeneral(obtenerMensajeErrorExamen(error));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="configuracion-examen-pagina">
      <header className="configuracion-examen-encabezado">
        <button
          type="button"
          className="configuracion-examen-volver"
          onClick={() => navigate("/examenes")}
        >
          <FiArrowLeft />
          Volver a exámenes
        </button>

        <h1>Configurar fecha, hora y duración</h1>
        <p>Complete la información del examen para su correcta ejecución.</p>
      </header>

      {cargando ? (
        <p role="status">Cargando información del examen...</p>
      ) : !examen ? (
        <div className="configuracion-examen-error" role="alert">
          {errorGeneral || "No se encontró el examen solicitado."}
        </div>
      ) : (
        <form onSubmit={guardarConfiguracion} noValidate>
          {errorGeneral && (
            <div className="configuracion-examen-error" role="alert">
              <strong>No se puede guardar la configuración.</strong>
              <span>{errorGeneral}</span>
            </div>
          )}

          {exito && (
            <div className="configuracion-examen-exito" role="status">
              {exito}
            </div>
          )}

          <section className="configuracion-examen-panel">
            <h2>Información del examen</h2>

            <div className="configuracion-examen-datos">
              <div className="configuracion-examen-campo">
                <label htmlFor="nombreExamen">Nombre del examen</label>

                <input
                  id="nombreExamen"
                  value={examen.nombreExamen ?? ""}
                  readOnly
                />
              </div>

              <div className="configuracion-examen-campo">
                <label htmlFor="asignatura">Asignatura</label>

                <input
                  id="asignatura"
                  value={obtenerNombreAsignatura(examen)}
                  readOnly
                />
              </div>
            </div>

            <div className="configuracion-examen-programacion">
              <div className="configuracion-examen-campo">
                <label htmlFor="fechaExamen">
                  Fecha del examen <span>*</span>
                </label>

                <input
                  id="fechaExamen"
                  type="date"
                  name="fechaExamen"
                  value={formulario.fechaExamen}
                  onChange={cambiarCampo}
                  aria-invalid={Boolean(errores.fechaExamen)}
                  required
                />

                {errores.fechaExamen && <small>{errores.fechaExamen}</small>}
              </div>

              <div className="configuracion-examen-campo">
                <label htmlFor="horaInicio">
                  Hora de inicio <span>*</span>
                </label>

                <input
                  id="horaInicio"
                  type="time"
                  name="horaInicio"
                  value={formulario.horaInicio}
                  onChange={cambiarCampo}
                  aria-invalid={Boolean(errores.horaInicio)}
                  required
                />

                {errores.horaInicio && <small>{errores.horaInicio}</small>}
              </div>

              <div className="configuracion-examen-campo">
                <label htmlFor="duracionMinutos">
                  Duración <span>*</span>
                </label>

                <div className="configuracion-examen-duracion">
                  <input
                    id="duracionMinutos"
                    type="number"
                    name="duracionMinutos"
                    value={formulario.duracionMinutos}
                    onChange={cambiarCampo}
                    min="1"
                    max="1439"
                    step="1"
                    placeholder="Ej. 90"
                    aria-invalid={Boolean(errores.duracionMinutos)}
                    required
                  />

                  <span>minutos</span>
                </div>

                {errores.duracionMinutos && (
                  <small>{errores.duracionMinutos}</small>
                )}
              </div>
            </div>

            <div className="configuracion-examen-informacion">
              <FiInfo />
              <p>
                La fecha, hora y duración configuradas se utilizarán durante el
                control de ingreso al examen y en los reportes del sistema.
              </p>
            </div>

            <footer className="configuracion-examen-acciones">
              <button
                type="button"
                className="configuracion-examen-cancelar"
                onClick={() => navigate("/examenes")}
                disabled={guardando}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="configuracion-examen-guardar"
                disabled={guardando}
              >
                <FiSave />
                {guardando ? "Guardando..." : "Guardar configuración"}
              </button>
            </footer>
          </section>
        </form>
      )}
    </div>
  );
}

export default ConfigurarExamen;
