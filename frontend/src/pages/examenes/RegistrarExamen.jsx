import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  actualizarExamen,
  obtenerAsignaturasParaExamen,
  obtenerExamenPorId,
  obtenerPlanEstudiosMateria,
  registrarExamen,
} from "../../services/examenService";
import ModalExito from "../../components/Modal/ModalExito.jsx";
import ModalError from "../../components/Modal/ModalError.jsx";

import "./RegistrarExamen.css";

const TIPOS_EXAMEN = [
  { valor: "PRIMER_PARCIAL", etiqueta: "Primer parcial" },
  { valor: "SEGUNDO_PARCIAL", etiqueta: "Segundo Parcial" },
  { valor: "FINAL", etiqueta: "Final" },
  { valor: "PRACTICO", etiqueta: "Práctico" },
  { valor: "ESTANCIA", etiqueta: "Estancia" },
];

const ESTADOS_EXAMEN = [
  { valor: "ACTIVO", etiqueta: "Activo" },
  { valor: "PROGRAMADO", etiqueta: "Programado" },
  { valor: "EN_PREPARACION", etiqueta: "En preparación" },
  { valor: "INACTIVO", etiqueta: "Inactivo" },
];

const DATOS_INICIALES = {
  codigoExamen: "",
  nombreExamen: "",
  idMateria: "",
  tipoEvaluacion: "",
  gestion: "",
  estado: "ACTIVO",
  descripcion: "",
};

const MENSAJE_VALIDACION =
  "Complete la información obligatoria antes de guardar.";

const ANIO_ACTUAL = new Date().getFullYear();

const PERIODOS_POR_PLAN = {
  SEMESTRAL: [1, 2, 3, 4],
  ANUAL: [1, 2, 3],
};

const generarCodigoExamen = () => {
  const letras = Array.from({ length: 3 }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26)),
  ).join("");
  const numeros = String(Math.floor(Math.random() * 1000)).padStart(3, "0");

  return `${letras}-${numeros}`;
};

const construirNombreExamen = (tipoEvaluacion, idMateria, asignaturas) => {
  const tipo = TIPOS_EXAMEN.find((t) => t.valor === tipoEvaluacion);
  const materia = asignaturas.find(
    (m) => String(m.idMateria) === String(idMateria),
  );

  if (!tipo || !materia) {
    return null;
  }

  return `${tipo.etiqueta} ${materia.nombreAsignatura}`;
};

function Campo({ id, etiqueta, requerido = false, error, children }) {
  return (
    <div className="registrar-examen-campo">
      <label htmlFor={id}>
        {etiqueta}

        {requerido && (
          <span className="registrar-examen-asterisco"> *</span>
        )}
      </label>

      {children}

      {error && (
        <span className="registrar-examen-error-campo" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

function RegistrarExamen() {
  const navigate = useNavigate();
  const { id } = useParams();

  const modoEdicion = Boolean(id);

  const [datos, setDatos] = useState(() => ({
    ...DATOS_INICIALES,
    codigoExamen: modoEdicion ? "" : generarCodigoExamen(),
  }));
  const [errores, setErrores] = useState({});
  const [alerta, setAlerta] = useState("");
  const [errorModal, setErrorModal] = useState(null);

  const [asignaturas, setAsignaturas] = useState([]);
  const [cargandoAsignaturas, setCargandoAsignaturas] = useState(true);
  const [errorAsignaturas, setErrorAsignaturas] = useState("");

  const [cargandoExamen, setCargandoExamen] = useState(modoEdicion);
  const [guardando, setGuardando] = useState(false);
  const [mostrarExito, setMostrarExito] = useState(false);

  const [planCargado, setPlanCargado] = useState(null);
  const [cargandoPlan, setCargandoPlan] = useState(false);
  const materiaAnteriorRef = useRef(datos.idMateria);

  useEffect(() => {
    let activo = true;

    const cargarAsignaturas = async () => {
      setCargandoAsignaturas(true);

      try {
        const respuesta = await obtenerAsignaturasParaExamen();
        const lista = Array.isArray(respuesta.data) ? respuesta.data : [];

        if (activo) {
          setAsignaturas(lista);
          setErrorAsignaturas("");
        }
      } catch (error) {
        console.error("Error cargando asignaturas:", error);

        if (activo) {
          setAsignaturas([]);
          setErrorAsignaturas(
            "No se pudieron cargar las asignaturas disponibles.",
          );
        }
      } finally {
        if (activo) {
          setCargandoAsignaturas(false);
        }
      }
    };

    cargarAsignaturas();

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (!modoEdicion) {
      return undefined;
    }

    let activo = true;

    const cargarExamen = async () => {
      setCargandoExamen(true);

      try {
        const respuesta = await obtenerExamenPorId(id);
        const examen = respuesta.data;

        if (activo && examen) {
          setDatos({
            codigoExamen: examen.codigo ?? "",
            nombreExamen: examen.nombreExamen ?? "",
            idMateria: examen.idMateria ? String(examen.idMateria) : "",
            tipoEvaluacion: examen.tipoEvaluacion ?? "",
            gestion: examen.gestion ?? "",
            estado: examen.estado ?? "ACTIVO",
            descripcion: examen.descripcion ?? "",
          });
        }
      } catch (error) {
        console.error("Error cargando el examen:", error);

        if (activo) {
          setErrorModal({
            titulo: "No se pudo cargar el examen",
            mensaje: "No se pudo cargar la información del examen.",
          });
        }
      } finally {
        if (activo) {
          setCargandoExamen(false);
        }
      }
    };

    cargarExamen();

    return () => {
      activo = false;
    };
  }, [id, modoEdicion]);

  useEffect(() => {
    const materiaAnterior = materiaAnteriorRef.current;
    materiaAnteriorRef.current = datos.idMateria;

    if (materiaAnterior !== datos.idMateria && !cargandoExamen) {
      setDatos((anterior) =>
        anterior.gestion
          ? { ...anterior, gestion: "" }
          : anterior,
      );
    }
  }, [datos.idMateria, cargandoExamen]);

  useEffect(() => {
    if (!datos.idMateria) {
      return undefined;
    }

    let activo = true;

    const cargarPlan = async () => {
      setCargandoPlan(true);

      try {
        const respuesta = await obtenerPlanEstudiosMateria(datos.idMateria);

        if (activo) {
          setPlanCargado({
            idMateria: datos.idMateria,
            plan: respuesta.data?.plan ?? "SEMESTRAL",
          });
        }
      } catch (error) {
        console.error("Error cargando plan de estudios:", error);

        if (activo) {
          setPlanCargado({
            idMateria: datos.idMateria,
            plan: "SEMESTRAL",
          });
        }
      } finally {
        if (activo) {
          setCargandoPlan(false);
        }
      }
    };

    cargarPlan();

    return () => {
      activo = false;
    };
  }, [datos.idMateria]);

  const planEstudios =
    planCargado?.idMateria === datos.idMateria ? planCargado.plan : null;

  const opcionesGestion = (() => {
    const periodos =
      PERIODOS_POR_PLAN[planEstudios] ?? PERIODOS_POR_PLAN.SEMESTRAL;

    const opciones = periodos.map((periodo) => ({
      valor: `${periodo}/${ANIO_ACTUAL}`,
      etiqueta: `${periodo}/${ANIO_ACTUAL}`,
    }));

    if (
      datos.gestion &&
      !opciones.some((opcion) => opcion.valor === datos.gestion)
    ) {
      opciones.unshift({
        valor: datos.gestion,
        etiqueta: datos.gestion,
      });
    }

    return opciones;
  })();

  const nombreExamen = (() => {
    if (!datos.tipoEvaluacion || !datos.idMateria) {
      return "";
    }

    return (
      construirNombreExamen(
        datos.tipoEvaluacion,
        datos.idMateria,
        asignaturas,
      ) ?? datos.nombreExamen
    );
  })();

  const actualizarCampo = (campo, valor) => {
    setDatos((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));

    if (errores[campo]) {
      const siguientes = { ...errores };
      delete siguientes[campo];

      setErrores(siguientes);

      if (
        Object.keys(siguientes).length === 0 &&
        alerta === MENSAJE_VALIDACION
      ) {
        setAlerta("");
      }
    }
  };

  const validar = () => {
    const nuevos = {};

    if (!datos.codigoExamen.trim()) {
      nuevos.codigoExamen = "Este campo es obligatorio.";
    } else if (
      datos.codigoExamen.trim().length > 30 ||
      !/^[A-Za-z0-9_-]+$/.test(datos.codigoExamen.trim())
    ) {
      nuevos.codigoExamen =
        "Usa solo letras, números, guion o guion bajo (máx. 30).";
    }

    if (!datos.idMateria) {
      nuevos.idMateria = "Seleccione una asignatura.";
    }

    if (!datos.tipoEvaluacion) {
      nuevos.tipoEvaluacion = "Seleccione un tipo.";
    }

    if (!datos.gestion.trim()) {
      nuevos.gestion = "Este campo es obligatorio.";
    }

    if (!datos.estado) {
      nuevos.estado = "Seleccione un estado.";
    }

    return nuevos;
  };

  const manejarEnvio = async (evento) => {
    evento.preventDefault();

    if (guardando) {
      return;
    }

    const nuevosErrores = validar();

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      setErrorModal({
        titulo: "Falta información obligatoria",
        mensaje: MENSAJE_VALIDACION,
      });
      return;
    }

    setErrores({});
    setAlerta("");
    setGuardando(true);

    const cuerpo = {
      codigoExamen: datos.codigoExamen.trim(),
      nombreExamen: nombreExamen.trim(),
      idMateria: Number(datos.idMateria),
      tipoEvaluacion: datos.tipoEvaluacion,
      gestion: datos.gestion.trim(),
      estado: datos.estado,
      descripcion: datos.descripcion.trim() || null,
    };

    try {
      if (modoEdicion) {
        await actualizarExamen(id, cuerpo);
      } else {
        await registrarExamen(cuerpo);
      }

      setMostrarExito(true);
    } catch (error) {
      console.error("Error guardando el examen:", error);

      const status = error?.response?.status;
      const mensajeBackend = error?.response?.data?.mensaje;

      if (status === 409 && !modoEdicion) {
        const codigoAnterior = datos.codigoExamen;
        const codigoNuevo = generarCodigoExamen();

        setDatos((anterior) => ({
          ...anterior,
          codigoExamen: codigoNuevo,
        }));

        setAlerta(
          `El código ${codigoAnterior} ya está en uso. Se generó el código ${codigoNuevo}; revisa los datos y vuelve a guardar.`,
        );
      } else {
        setErrorModal({
          titulo: modoEdicion
            ? "No se pudo guardar el examen"
            : "No se pudo registrar el examen",
          mensaje:
            typeof mensajeBackend === "string" && mensajeBackend.trim()
              ? mensajeBackend
              : "No se pudo guardar el examen. Intenta nuevamente.",
        });
      }

      setGuardando(false);
    }
  };

  const claseControl = (campo) =>
    errores[campo]
      ? "registrar-examen-control registrar-examen-control-error"
      : "registrar-examen-control";

  return (
    <div className="registrar-examen-pagina">
      <header className="registrar-examen-encabezado">
        <h1>{modoEdicion ? "Editar examen" : "Registrar examen"}</h1>

        <p>
          Complete la información del examen para utilizarlo en la organización
          de las evaluaciones masivas.
        </p>
      </header>

      {alerta && (
        <div className="registrar-examen-alerta" role="alert">
          <div className="registrar-examen-alerta-icono">!</div>

          <div className="registrar-examen-alerta-texto">
            <strong>
              {modoEdicion
                ? "No se pudo guardar el examen."
                : "No se pudo registrar el examen."}
            </strong>

            <span>{alerta}</span>
          </div>
        </div>
      )}

      <section className="registrar-examen-tarjeta">
        <h2 className="registrar-examen-seccion">Información del examen</h2>

        {modoEdicion && cargandoExamen ? (
          <p className="registrar-examen-cargando">
            Cargando información del examen...
          </p>
        ) : (
          <form onSubmit={manejarEnvio} noValidate>
            <div className="registrar-examen-grid">
              <Campo
                id="examen-codigo"
                etiqueta="Código de examen"
                requerido
                error={errores.codigoExamen}
              >
                <input
                  id="examen-codigo"
                  className={claseControl("codigoExamen")}
                  value={datos.codigoExamen}
                  placeholder="ABC-123"
                  maxLength={7}
                  disabled
                />
              </Campo>

              <Campo
                id="examen-nombre"
                etiqueta="Nombre del examen"
                requerido
                error={errores.nombreExamen}
              >
                <input
                  id="examen-nombre"
                  className={claseControl("nombreExamen")}
                  value={nombreExamen}
                  placeholder="Se genera al seleccionar el tipo y la asignatura"
                  maxLength={120}
                  disabled
                />
              </Campo>

              <Campo
                id="examen-asignatura"
                etiqueta="Asignatura"
                requerido
                error={errores.idMateria}
              >
                <select
                  id="examen-asignatura"
                  className={claseControl("idMateria")}
                  value={datos.idMateria}
                  onChange={(e) =>
                    actualizarCampo("idMateria", e.target.value)
                  }
                  disabled={guardando || cargandoAsignaturas}
                >
                  <option value="">
                    {cargandoAsignaturas
                      ? "Cargando asignaturas..."
                      : "Seleccione una asignatura"}
                  </option>

                  {asignaturas.map((materia) => (
                    <option key={materia.idMateria} value={materia.idMateria}>
                      {materia.nombreAsignatura}
                      {materia.grupo ? ` — ${materia.grupo}` : ""}
                    </option>
                  ))}
                </select>
              </Campo>

              <Campo
                id="examen-tipo"
                etiqueta="Tipo de examen"
                requerido
                error={errores.tipoEvaluacion}
              >
                <select
                  id="examen-tipo"
                  className={claseControl("tipoEvaluacion")}
                  value={datos.tipoEvaluacion}
                  onChange={(e) =>
                    actualizarCampo("tipoEvaluacion", e.target.value)
                  }
                  disabled={guardando}
                >
                  <option value="">Seleccione un tipo</option>

                  {TIPOS_EXAMEN.map((tipo) => (
                    <option key={tipo.valor} value={tipo.valor}>
                      {tipo.etiqueta}
                    </option>
                  ))}
                </select>
              </Campo>

              <Campo
                id="examen-gestion"
                etiqueta="Gestión / periodo"
                requerido
                error={errores.gestion}
              >
                <select
                  id="examen-gestion"
                  className={claseControl("gestion")}
                  value={datos.gestion}
                  onChange={(e) =>
                    actualizarCampo("gestion", e.target.value)
                  }
                  disabled={
                    guardando || !datos.idMateria || cargandoPlan
                  }
                >
                  <option value="">
                    {datos.idMateria
                      ? cargandoPlan
                        ? "Cargando..."
                        : "Seleccione un periodo"
                      : "Seleccione primero una asignatura"}
                  </option>

                  {opcionesGestion.map((opcion) => (
                    <option key={opcion.valor} value={opcion.valor}>
                      {opcion.etiqueta}
                    </option>
                  ))}
                </select>
              </Campo>

              <Campo
                id="examen-estado"
                etiqueta="Estado"
                requerido
                error={errores.estado}
              >
                <select
                  id="examen-estado"
                  className={claseControl("estado")}
                  value={datos.estado}
                  onChange={(e) => actualizarCampo("estado", e.target.value)}
                  disabled={guardando}
                >
                  {ESTADOS_EXAMEN.map((estado) => (
                    <option key={estado.valor} value={estado.valor}>
                      {estado.etiqueta}
                    </option>
                  ))}
                </select>
              </Campo>

              <div className="registrar-examen-campo registrar-examen-campo-ancho">
                <label htmlFor="examen-descripcion">Descripción</label>

                <textarea
                  id="examen-descripcion"
                  className="registrar-examen-control registrar-examen-textarea"
                  value={datos.descripcion}
                  onChange={(e) =>
                    actualizarCampo("descripcion", e.target.value)
                  }
                  placeholder="Ingrese una breve descripción del examen..."
                  maxLength={500}
                  disabled={guardando}
                />
              </div>
            </div>

            {errorAsignaturas && (
              <p className="registrar-examen-aviso">{errorAsignaturas}</p>
            )}

            <div className="registrar-examen-pie">
              <span className="registrar-examen-obligatorios">
                Los campos marcados con{" "}
                <span className="registrar-examen-asterisco">*</span> son
                obligatorios.
              </span>

              <div className="registrar-examen-acciones">
                <button
                  type="button"
                  className="registrar-examen-cancelar"
                  onClick={() => navigate("/examenes")}
                  disabled={guardando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="registrar-examen-guardar"
                  disabled={guardando}
                >
                  {guardando ? "Guardando..." : "Guardar examen"}
                </button>
              </div>
            </div>
          </form>
        )}
      </section>

      <ModalError
        abierto={Boolean(errorModal)}
        titulo={errorModal?.titulo}
        mensaje={errorModal?.mensaje}
        onCerrar={() => setErrorModal(null)}
      />

      <ModalExito
        abierto={mostrarExito}
        titulo={modoEdicion ? "Examen actualizado" : "Examen registrado"}
        mensaje={
          modoEdicion
            ? "El examen se actualizó correctamente."
            : "El examen se registró correctamente."
        }
        onCerrar={() => navigate("/examenes")}
      />
    </div>
  );
}

export default RegistrarExamen;
