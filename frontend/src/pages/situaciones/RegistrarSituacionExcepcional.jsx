
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  obtenerCatalogoExamenes,
  obtenerEstudiantesExamen,
  registrarSituacionExcepcional,
  adjuntarEvidenciaSituacion,
  obtenerErrorSituacion,
} from "../../services/situacionExcepcionalService";

import "./RegistrarSituacionExcepcional.css";

const DATOS_INICIALES = {
  idExamen: "",
  idEstudiante: "",
  tipoSituacion: "",
  descripcion: "",
  fechaOcurrencia: "",
  horaOcurrencia: "",
};

const TAMANO_MAXIMO = 5 * 1024 * 1024;

const TIPOS_ARCHIVO = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

function RegistrarSituacionExcepcional() {
  const navigate = useNavigate();

  const [datos, setDatos] = useState(DATOS_INICIALES);
  const [examenes, setExamenes] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);

  const [archivo, setArchivo] = useState(null);
  const [claveArchivo, setClaveArchivo] = useState(0);

  const [cargandoExamenes, setCargandoExamenes] = useState(true);
  const [cargandoEstudiantes, setCargandoEstudiantes] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [errores, setErrores] = useState({});
  const [errorCarga, setErrorCarga] = useState("");
  const [errorGeneral, setErrorGeneral] = useState("");
  const [aviso, setAviso] = useState("");

  const [idRegistrado, setIdRegistrado] = useState(null);
  const [finalizado, setFinalizado] = useState(false);
  const [registroSinIdentificador, setRegistroSinIdentificador] =
    useState(false);

  useEffect(() => {
    let activo = true;

    const cargarExamenes = async () => {
      try {
        const respuesta = await obtenerCatalogoExamenes();
        const lista = Array.isArray(respuesta.data)
          ? respuesta.data
          : [];

        if (activo) {
          setExamenes(lista);
          setErrorCarga("");
        }
      } catch (error) {
        if (activo) {
          setErrorCarga(
            obtenerErrorSituacion(
              error,
              "No se pudieron cargar los exámenes.",
            ),
          );
        }
      } finally {
        if (activo) {
          setCargandoExamenes(false);
        }
      }
    };

    cargarExamenes();

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (!datos.idExamen) {
      return undefined;
    }

    let activo = true;

    const cargarEstudiantes = async () => {
      setCargandoEstudiantes(true);

      try {
        const respuesta = await obtenerEstudiantesExamen(
          datos.idExamen,
        );

        if (activo) {
          setEstudiantes(
            Array.isArray(respuesta.data) ? respuesta.data : [],
          );
        }
      } catch (error) {
        if (activo) {
          setEstudiantes([]);
          setErrorCarga(
            obtenerErrorSituacion(
              error,
              "No se pudieron cargar los estudiantes del examen.",
            ),
          );
        }
      } finally {
        if (activo) {
          setCargandoEstudiantes(false);
        }
      }
    };

    cargarEstudiantes();

    return () => {
      activo = false;
    };
  }, [datos.idExamen]);

  const actualizarCampo = (campo, valor) => {
    setDatos((anterior) => ({
      ...anterior,
      [campo]: valor,
      ...(campo === "idExamen" ? { idEstudiante: "" } : {}),
    }));

    if (campo === "idExamen") {
      setEstudiantes([]);
      setErrorCarga("");
    }

    setErrores((anterior) => ({
      ...anterior,
      [campo]: "",
    }));

    setErrorGeneral("");
  };

  const seleccionarArchivo = (evento) => {
    const seleccionado = evento.target.files?.[0] ?? null;
    setArchivo(seleccionado);

    setErrores((anterior) => ({
      ...anterior,
      archivo: "",
    }));

    setErrorGeneral("");
  };

  const validarArchivo = () => {
    if (!archivo) {
      return "";
    }

    if (archivo.size === 0) {
      return "El archivo está vacío.";
    }

    if (archivo.size > TAMANO_MAXIMO) {
      return "El archivo no puede superar 5 MB.";
    }

    if (!TIPOS_ARCHIVO.includes(archivo.type)) {
      return "Solo se permiten archivos PDF, JPG y PNG.";
    }

    return "";
  };

  const validarFormulario = () => {
    const nuevos = {};

    if (!datos.idExamen) {
      nuevos.idExamen = "Seleccione un examen.";
    }

    if (!datos.tipoSituacion.trim()) {
      nuevos.tipoSituacion = "Indique el tipo de situación.";
    } else if (datos.tipoSituacion.trim().length > 100) {
      nuevos.tipoSituacion = "El tipo no puede superar 100 caracteres.";
    }

    if (!datos.descripcion.trim()) {
      nuevos.descripcion = "Ingrese una descripción de lo ocurrido.";
    }

    if (!datos.fechaOcurrencia) {
      nuevos.fechaOcurrencia = "Seleccione la fecha de ocurrencia.";
    }

    if (!datos.horaOcurrencia) {
      nuevos.horaOcurrencia = "Seleccione la hora de ocurrencia.";
    }

    const errorArchivo = validarArchivo();

    if (errorArchivo) {
      nuevos.archivo = errorArchivo;
    }

    return nuevos;
  };

  const registrar = async (evento) => {
    evento.preventDefault();

    if (guardando || finalizado || registroSinIdentificador) {
      return;
    }

    if (!idRegistrado) {
      const nuevosErrores = validarFormulario();

      if (Object.keys(nuevosErrores).length > 0) {
        setErrores(nuevosErrores);
        setErrorGeneral("Revise los campos marcados.");
        return;
      }
    } else {
      const errorArchivo = validarArchivo();

      if (!archivo || errorArchivo) {
        setErrores({ archivo: errorArchivo || "Seleccione un archivo." });
        return;
      }
    }

    setErrores({});
    setErrorGeneral("");
    setAviso("");
    setGuardando(true);

    try {
      let identificador = idRegistrado;

      if (!identificador) {
        const respuesta = await registrarSituacionExcepcional({
          idExamen: Number(datos.idExamen),
          idEstudiante: datos.idEstudiante
            ? Number(datos.idEstudiante)
            : null,
          tipoSituacion: datos.tipoSituacion.trim(),
          descripcion: datos.descripcion.trim(),
          fechaOcurrencia: datos.fechaOcurrencia,
          horaOcurrencia: datos.horaOcurrencia,
        });

        identificador = Number(respuesta.data?.idSituacion);

        if (!Number.isSafeInteger(identificador) || identificador <= 0) {
          setRegistroSinIdentificador(true);
          setErrorGeneral(
            "El servidor confirmó el registro, pero no devolvió " +
              "su identificador. Consulte el historial antes de " +
              "intentar registrar nuevamente.",
          );
          return;
        }

        setIdRegistrado(identificador);
      }

      if (archivo) {
        try {
          await adjuntarEvidenciaSituacion(identificador, archivo);
        } catch (error) {
          setAviso(
            `La situación ${identificador} se registró correctamente, ` +
              "pero no se pudo adjuntar la evidencia. " +
              obtenerErrorSituacion(error) +
              " Puede reintentar la subida sin duplicar el registro.",
          );
          return;
        }
      }

      setFinalizado(true);
    } catch (error) {
      setErrorGeneral(
        obtenerErrorSituacion(
          error,
          "No se pudo registrar la situación excepcional.",
        ),
      );
    } finally {
      setGuardando(false);
    }
  };

  const nuevoRegistro = () => {
    setDatos({ ...DATOS_INICIALES });
    setEstudiantes([]);
    setArchivo(null);
    setClaveArchivo((anterior) => anterior + 1);
    setErrores({});
    setErrorGeneral("");
    setAviso("");
    setIdRegistrado(null);
    setFinalizado(false);
    setRegistroSinIdentificador(false);
  };

  const registroCreado = idRegistrado !== null;

  return (
    <div className="situacion-pagina">
      <header className="situacion-encabezado">
        <h1>Registrar situación excepcional</h1>
        <p>
          Registre una incidencia ocurrida durante un examen.
          Los campos marcados con * son obligatorios.
        </p>
      </header>

      {errorCarga && (
        <div className="situacion-alerta" role="alert">
          {errorCarga}
        </div>
      )}

      {errorGeneral && (
        <div className="situacion-alerta" role="alert">
          {errorGeneral}
        </div>
      )}

      {aviso && (
        <div className="situacion-aviso" role="alert">
          {aviso}
        </div>
      )}

      {finalizado && (
        <div className="situacion-exito" role="status">
          <h2>Situación registrada correctamente</h2>
          <p>Número de registro: {idRegistrado}</p>
          <p>
            {archivo
              ? "La evidencia también fue adjuntada correctamente."
              : "El registro se completó sin evidencia adjunta."}
          </p>
          <button type="button" onClick={nuevoRegistro}>
            Registrar otra situación
          </button>
        </div>
      )}

      {!finalizado && (
        <section className="situacion-tarjeta">
          <form onSubmit={registrar} noValidate>
            <fieldset
              disabled={
                guardando ||
                registroCreado ||
                registroSinIdentificador
              }
            >
              <legend>Información de la situación</legend>

              <div className="situacion-grid">
                <div className="situacion-campo">
                  <label htmlFor="situacion-examen">
                    Examen *
                  </label>

                  <select
                    id="situacion-examen"
                    value={datos.idExamen}
                    onChange={(e) =>
                      actualizarCampo("idExamen", e.target.value)
                    }
                    aria-invalid={Boolean(errores.idExamen)}
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
                        {examen.nombreExamen}
                      </option>
                    ))}
                  </select>

                  {errores.idExamen && (
                    <span className="situacion-error">
                      {errores.idExamen}
                    </span>
                  )}
                </div>

                <div className="situacion-campo">
                  <label htmlFor="situacion-estudiante">
                    Estudiante (opcional)
                  </label>

                  <select
                    id="situacion-estudiante"
                    value={datos.idEstudiante}
                    onChange={(e) =>
                      actualizarCampo("idEstudiante", e.target.value)
                    }
                    disabled={
                      !datos.idExamen || cargandoEstudiantes
                    }
                  >
                    <option value="">
                      {cargandoEstudiantes
                        ? "Cargando estudiantes..."
                        : "Sin estudiante específico"}
                    </option>

                    {estudiantes.map((estudiante) => (
                      <option
                        key={estudiante.idEstudiante}
                        value={estudiante.idEstudiante}
                      >
                        {estudiante.nombreEstudiante}
                      </option>
                    ))}
                  </select>

                  <small>
                    Déjelo vacío si la situación afectó a todo el examen.
                  </small>
                </div>

                <div className="situacion-campo">
                  <label htmlFor="situacion-tipo">
                    Tipo de situación *
                  </label>

                  <input
                    id="situacion-tipo"
                    type="text"
                    value={datos.tipoSituacion}
                    onChange={(e) =>
                      actualizarCampo("tipoSituacion", e.target.value)
                    }
                    maxLength={100}
                    placeholder="Ej.: Corte de energía"
                    aria-invalid={Boolean(errores.tipoSituacion)}
                  />

                  {errores.tipoSituacion && (
                    <span className="situacion-error">
                      {errores.tipoSituacion}
                    </span>
                  )}
                </div>

                <div className="situacion-campo">
                  <label htmlFor="situacion-fecha">
                    Fecha de ocurrencia *
                  </label>

                  <input
                    id="situacion-fecha"
                    type="date"
                    value={datos.fechaOcurrencia}
                    onChange={(e) =>
                      actualizarCampo("fechaOcurrencia", e.target.value)
                    }
                    aria-invalid={Boolean(errores.fechaOcurrencia)}
                  />

                  {errores.fechaOcurrencia && (
                    <span className="situacion-error">
                      {errores.fechaOcurrencia}
                    </span>
                  )}
                </div>

                <div className="situacion-campo">
                  <label htmlFor="situacion-hora">
                    Hora de ocurrencia *
                  </label>

                  <input
                    id="situacion-hora"
                    type="time"
                    value={datos.horaOcurrencia}
                    onChange={(e) =>
                      actualizarCampo("horaOcurrencia", e.target.value)
                    }
                    aria-invalid={Boolean(errores.horaOcurrencia)}
                  />

                  {errores.horaOcurrencia && (
                    <span className="situacion-error">
                      {errores.horaOcurrencia}
                    </span>
                  )}
                </div>

                <div className="situacion-campo situacion-ancho">
                  <label htmlFor="situacion-descripcion">
                    Descripción de lo ocurrido *
                  </label>

                  <textarea
                    id="situacion-descripcion"
                    value={datos.descripcion}
                    onChange={(e) =>
                      actualizarCampo("descripcion", e.target.value)
                    }
                    rows={5}
                    placeholder="Describa qué ocurrió y cómo afectó al examen..."
                    aria-invalid={Boolean(errores.descripcion)}
                  />

                  {errores.descripcion && (
                    <span className="situacion-error">
                      {errores.descripcion}
                    </span>
                  )}
                </div>
              </div>
            </fieldset>

            <div className="situacion-campo situacion-evidencia">
              <label htmlFor="situacion-archivo">
                Evidencia adjunta (opcional)
              </label>

              <input
                key={claveArchivo}
                id="situacion-archivo"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={seleccionarArchivo}
                disabled={
                  guardando ||
                  finalizado ||
                  registroSinIdentificador
                }
              />

              <small>
                PDF, JPG o PNG. Tamaño máximo: 5 MB.
              </small>

              {errores.archivo && (
                <span className="situacion-error">
                  {errores.archivo}
                </span>
              )}
            </div>

            {registroCreado && (
              <div className="situacion-aviso">
                El registro {idRegistrado} ya existe.
                Solo se reintentará adjuntar la evidencia.
              </div>
            )}

            <div className="situacion-acciones">
              <button
                type="button"
                className="situacion-cancelar"
                onClick={() => navigate("/")}
                disabled={guardando}
              >
                Volver al inicio
              </button>

              <button
                type="submit"
                className="situacion-guardar"
                disabled={
                  guardando ||
                  cargandoExamenes ||
                  registroSinIdentificador
                }
              >
                {guardando
                  ? "Guardando..."
                  : registroCreado
                    ? "Reintentar evidencia"
                    : "Registrar situación"}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}

export default RegistrarSituacionExcepcional;
