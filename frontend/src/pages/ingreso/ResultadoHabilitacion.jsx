import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FiAlertCircle,
  FiCheckCircle,
  FiFileText,
  FiInfo,
  FiX,
} from "react-icons/fi";

import {
  consultarIngresoRegistrado,
  obtenerIngresoRegistrado,
  registrarIntentoIngresoDuplicado,
  registrarIngresoExamen,
  verificarIngresoYRegistrarRechazo,
} from "../../services/validacionHabilitacionService";

import "./ValidarHabilitacion.css";

function ResultadoHabilitacion({
  idExamen,
  idEstudiante,
  nombreExamen,
  nombreEstudiante,
  codigoEstudiante,
}) {
  const navigate = useNavigate();

  const [consulta, setConsulta] = useState(null);
  const [estadoIngreso, setEstadoIngreso] = useState(null);
  const [guardandoIngreso, setGuardandoIngreso] = useState(false);

  const [modalDuplicadoAbierto, setModalDuplicadoAbierto] =
    useState(false);
  const [errorRegistroIntento, setErrorRegistroIntento] = useState("");

  const registrandoActual = useRef(false);
  const intentosDuplicadosEnviados = useRef(new Set());
  const verificacionesEnCurso = useRef(new Map());

  const claveIngreso = `${idExamen}:${idEstudiante}`;

  const consultaActual =
    consulta?.clave === claveIngreso ? consulta : null;

  const resultado = consultaActual?.resultado || null;
  const error = consultaActual?.error || "";
  const cargando = !consultaActual;

  const habilitado =
    resultado?.estado === "HABILITADO" &&
    resultado?.puedeContinuar === true;

  const ingresoActual =
    estadoIngreso?.clave === claveIngreso
      ? estadoIngreso
      : null;

  // Control del modal
  useEffect(() => {
    if (!modalDuplicadoAbierto) {
      return undefined;
    }

    const overflowAnterior = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const cerrarConEscape = (evento) => {
      if (evento.key === "Escape") {
        setModalDuplicadoAbierto(false);
      }
    };

    window.addEventListener("keydown", cerrarConEscape);

    return () => {
      document.body.style.overflow = overflowAnterior;

      window.removeEventListener(
        "keydown",
        cerrarConEscape
      );
    };
  }, [modalDuplicadoAbierto]);

  // Consultar habilitación
  useEffect(() => {
    let activo = true;

    async function validar() {
      try {
        let solicitud = verificacionesEnCurso.current.get(claveIngreso);
        if (!solicitud) {
          solicitud = verificarIngresoYRegistrarRechazo(
            Number(idExamen),
            Number(idEstudiante)
          );
          verificacionesEnCurso.current.set(claveIngreso, solicitud);
        }
        const datos = await solicitud;

        if (!activo) {
          return;
        }

        const estadosValidos = [
          "HABILITADO",
          "INHABILITADO",
          "SIN_ESTADO",
          "NO_ASOCIADO",
        ];

        const respuestaValida =
          Number(datos?.idExamen) === Number(idExamen) &&
          Number(datos?.idEstudiante) ===
            Number(idEstudiante) &&
          estadosValidos.includes(datos?.estado) &&
          typeof datos?.puedeContinuar === "boolean" &&
          (
            datos.estado === "HABILITADO" ||
            datos.puedeContinuar === false
          );

        if (!respuestaValida) {
          setConsulta({
            clave: claveIngreso,
            resultado: null,
            error:
              "El servidor devolvió una validación incompleta o inconsistente.",
          });

          return;
        }

        setConsulta({
          clave: claveIngreso,
          resultado: datos,
          error: "",
        });
      } catch (err) {
        verificacionesEnCurso.current.delete(claveIngreso);
        if (!activo) {
          return;
        }

        setConsulta({
          clave: claveIngreso,
          resultado: null,
          error:
            err.response?.data?.mensaje ||
            err.response?.data?.message ||
            "No se pudo completar la validación. Verifique la conexión.",
        });
      }
    }

    void validar();

    return () => {
      activo = false;
    };
  }, [
    idExamen,
    idEstudiante,
    claveIngreso,
  ]);

  // Consultar ingreso existente
  useEffect(() => {
    if (!resultado || error) {
      return undefined;
    }

    let activo = true;

    async function consultarIngreso() {
      try {
        const datos = await consultarIngresoRegistrado(
          Number(idExamen),
          Number(idEstudiante)
        );

        if (!activo) {
          return;
        }

        setEstadoIngreso({
          clave: claveIngreso,
          registrado: datos.ingresoRegistrado === true,
          duplicado: datos.ingresoRegistrado === true,
          datos,
          detalle: null,
          error: "",
        });

        if (datos.ingresoRegistrado === true) {
          setModalDuplicadoAbierto(true);
          setErrorRegistroIntento("");
          if (!intentosDuplicadosEnviados.current.has(claveIngreso)) {
            intentosDuplicadosEnviados.current.add(claveIngreso);
            void registrarIntentoIngresoDuplicado(
              Number(idExamen),
              Number(idEstudiante)
            ).catch((errRegistro) => {
              intentosDuplicadosEnviados.current.delete(claveIngreso);
              setErrorRegistroIntento(
                errRegistro.response?.data?.mensaje ||
                  errRegistro.response?.data?.message ||
                  "No se pudo guardar este rechazo en el historial."
              );
            });
          }
        }

        if (
          datos.ingresoRegistrado === true &&
          datos.idIngreso
        ) {
          try {
            const detalle = await obtenerIngresoRegistrado(
              datos.idIngreso
            );

            if (!activo) {
              return;
            }

            setEstadoIngreso((actual) =>
              actual?.clave === claveIngreso
                ? {
                    ...actual,
                    detalle,
                  }
                : actual
            );
          } catch (err) {
            console.warn(
              "No se pudo consultar el detalle del ingreso:",
              err
            );
          }
        }
      } catch (err) {
        if (!activo) {
          return;
        }

        setEstadoIngreso({
          clave: claveIngreso,
          registrado: false,
          duplicado: false,
          datos: null,
          detalle: null,
          error:
            err.response?.data?.mensaje ||
            err.response?.data?.message ||
            "No se pudo verificar si el estudiante ya ingresó.",
        });
      }
    }

    void consultarIngreso();

    return () => {
      activo = false;
    };
  }, [
    resultado,
    error,
    idExamen,
    idEstudiante,
    claveIngreso,
  ]);

  // Registrar asistencia
  const registrarAsistencia = async () => {
    if (
      !habilitado ||
      registrandoActual.current ||
      !ingresoActual ||
      ingresoActual.registrado ||
      ingresoActual.error
    ) {
      return;
    }

    registrandoActual.current = true;
    setGuardandoIngreso(true);

    try {
      const datos = await registrarIngresoExamen(
        Number(idExamen),
        Number(idEstudiante)
      );

      setEstadoIngreso({
        clave: claveIngreso,
        registrado: true,
        duplicado: false,
        datos,
        detalle: null,
        error: "",
      });
    } catch (err) {
      const duplicado = err.response?.status === 409;

      setEstadoIngreso({
        clave: claveIngreso,
        registrado: duplicado,
        duplicado,
        datos: null,
        detalle: null,
        error: duplicado
          ? "Este estudiante ya tiene un ingreso registrado para este examen."
          : err.response?.data?.mensaje ||
            err.response?.data?.message ||
            "No se pudo registrar el ingreso. Verifique la conexión.",
      });

      if (duplicado) {
        setModalDuplicadoAbierto(true);
        setErrorRegistroIntento("");

        try {
          const registro =
            await consultarIngresoRegistrado(
              Number(idExamen),
              Number(idEstudiante)
            );

          const detalle = registro.idIngreso
            ? await obtenerIngresoRegistrado(
                registro.idIngreso
              )
            : null;

          setEstadoIngreso((actual) =>
            actual?.clave === claveIngreso
              ? {
                  ...actual,
                  datos: registro,
                  detalle,
                }
              : actual
          );
        } catch (errorConsulta) {
          console.warn(
            "No se pudo recuperar el registro existente:",
            errorConsulta
          );
        }
      }
    } finally {
      registrandoActual.current = false;
      setGuardandoIngreso(false);
    }
  };

  const abrirRegistroExistente = () => {
    setModalDuplicadoAbierto(true);
  };

  const idIngresoExistente =
    ingresoActual?.detalle?.idIngreso ||
    ingresoActual?.datos?.idIngreso;

  return (
    <div className="validacion-integrada">

      {/* Estado de carga */}

      {cargando && (
        <section
          className="validacion-resultado"
          role="status"
        >
          <h2>Validando habilitación...</h2>

          <p>
            Consultando el estado del estudiante.
          </p>
        </section>
      )}

      {/* Error de validación */}

      {!cargando && error && (
        <section
          className="validacion-resultado validacion-error"
          role="alert"
        >
          <h2>Validación no completada</h2>

          <p>{error}</p>

          <strong>Ingreso no autorizado.</strong>
        </section>
      )}

      {/* Resultado de habilitación */}

      {!cargando && resultado && (
        <section
          className={`validacion-resultado ${
            habilitado
              ? "validacion-habilitado"
              : "validacion-bloqueado"
          }`}
          aria-live="polite"
        >
          <h2>
            {habilitado
              ? "Estudiante habilitado"
              : resultado.estado === "INHABILITADO"
                ? "Estudiante inhabilitado"
                : "Ingreso no autorizado"}
          </h2>

          <div className="validacion-detalles">
            <p>
              <strong>Examen:</strong>{" "}
              {nombreExamen || idExamen}
            </p>

            <p>
              <strong>Estudiante:</strong>{" "}
              {nombreEstudiante || idEstudiante}
            </p>

            <p>
              <strong>Estado:</strong>{" "}
              {resultado.estado}
            </p>
          </div>

          <p>{resultado.mensaje}</p>

          {/* Motivo de inhabilitación */}

          {resultado.estado === "INHABILITADO" && (
            <div className="validacion-motivo">
              <h3>Motivo de inhabilitación</h3>

              <p>
                <strong>
                  {resultado.tituloMotivo ||
                    "Sin título registrado"}
                </strong>
              </p>

              <p>
                {resultado.motivo ||
                  "Sin detalle registrado"}
              </p>
            </div>
          )}

          <div className="validacion-decision">
            {habilitado
              ? "Habilitación confirmada. Puede continuar con las demás verificaciones."
              : "No se permite continuar con el ingreso."}
          </div>
        </section>
      )}

      {/* Registro de asistencia */}

      {!cargando && habilitado && !ingresoActual?.registrado && (
        <section
          className="validacion-panel"
          aria-live="polite"
        >
          <h2>Registro de asistencia</h2>

          {!ingresoActual ? (
            <p>
              Comprobando si el estudiante ya tiene
              un ingreso registrado...
            </p>
          ) : (
            <>
              {ingresoActual.error && (
                <p
                  role="alert"
                  className="ingreso-ya-registrado"
                >
                  {ingresoActual.error}
                </p>
              )}

              <button
                type="button"
                className="validacion-boton"
                disabled={
                  guardandoIngreso ||
                  Boolean(ingresoActual.error)
                }
                onClick={registrarAsistencia}
              >
                {guardandoIngreso
                  ? "Registrando..."
                  : "Registrar ingreso / asistencia"}
              </button>

              <p className="validacion-ayuda">
                La habilitación y los permisos del
                docente se comprueban nuevamente
                en el servidor.
              </p>
            </>
          )}
        </section>
      )}

      {!cargando && ingresoActual?.registrado && ingresoActual?.duplicado && (
        <section className="validacion-panel ingreso-existente-panel" aria-live="polite">
          <div className="ingreso-existente-aviso" role="status">
            <span className="ingreso-existente-icono" aria-hidden="true"><FiAlertCircle /></span>
            <div className="ingreso-existente-contenido">
              <strong>Asistencia ya registrada</strong>
              <p>{nombreEstudiante || `El estudiante ${idEstudiante}`} ya tiene asistencia para {nombreExamen || "este examen"}. El nuevo intento fue rechazado.</p>
            </div>
            <span className="ingreso-existente-etiqueta">DUPLICADO</span>
          </div>
          {errorRegistroIntento && <p className="duplicado-modal-error-historial" role="alert">{errorRegistroIntento}</p>}
          <button type="button" className="validacion-boton ingreso-existente-boton" onClick={abrirRegistroExistente}>
            <FiFileText aria-hidden="true" />
            Ver asistencia registrada
            <span aria-hidden="true">→</span>
          </button>
        </section>
      )}

      {!cargando && ingresoActual?.registrado && !ingresoActual?.duplicado && (
        <section className="validacion-panel ingreso-existente-panel ingreso-registro-confirmado" aria-live="polite">
          <div className="ingreso-existente-aviso ingreso-registro-confirmado-aviso" role="status">
            <span className="ingreso-existente-icono ingreso-registro-confirmado-icono" aria-hidden="true"><FiCheckCircle /></span>
            <div className="ingreso-existente-contenido">
              <strong>Asistencia registrada</strong>
              <p>El ingreso de {nombreEstudiante || `el estudiante ${idEstudiante}`} se registró correctamente para {nombreExamen || "este examen"}.</p>
            </div>
            <span className="ingreso-existente-etiqueta ingreso-registro-confirmado-etiqueta">REGISTRADO</span>
          </div>
          <button type="button" className="validacion-boton ingreso-existente-boton" onClick={() => navigate("/ingreso/ingresos-registrados", { state: { idIngreso: idIngresoExistente } })}>
            <FiFileText aria-hidden="true" />
            Ver asistencia registrada
            <span aria-hidden="true">→</span>
          </button>
        </section>
      )}

      {/* Modal de ingreso existente */}

      {ingresoActual?.registrado && ingresoActual?.duplicado &&
        modalDuplicadoAbierto && (
          <div
            className="duplicado-modal-overlay"
            onMouseDown={(evento) => {
              if (
                evento.target === evento.currentTarget
              ) {
                setModalDuplicadoAbierto(false);
              }
            }}
          >
            <section
              className="duplicado-modal"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="duplicado-titulo"
              aria-describedby="duplicado-descripcion"
            >
              <button
                type="button"
                className="duplicado-modal-cerrar-icono"
                onClick={() =>
                  setModalDuplicadoAbierto(false)
                }
                aria-label="Cerrar aviso"
              >
                <FiX aria-hidden="true" />
              </button>

              <div
                className="duplicado-modal-icono"
                aria-hidden="true"
              >
                <FiAlertCircle />
              </div>

              <h2 id="duplicado-titulo">
                Registro existente
              </h2>

              <p className="duplicado-modal-subtitulo">
                Este estudiante ya tiene un ingreso
                registrado.
              </p>

              <p
                id="duplicado-descripcion"
                className="duplicado-modal-descripcion"
              >
                {nombreEstudiante ||
                  `El estudiante ${idEstudiante}`}{" "}
                ya registró su ingreso
                {nombreExamen
                  ? ` en el examen ${nombreExamen}`
                  : " para este examen"}.
              </p>

              <div className="duplicado-modal-datos">
                <div>
                  <span>Código</span>

                  <strong>
                    {ingresoActual.detalle
                      ?.codigoUniversitario ||
                      codigoEstudiante ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>Examen</span>

                  <strong>
                    {ingresoActual.detalle
                      ?.nombreExamen ||
                      nombreExamen ||
                      `Examen ${idExamen}`}
                  </strong>
                </div>

                <div>
                  <span>Estado del ingreso</span>

                  <strong className="duplicado-modal-estado">
                    {ingresoActual.detalle?.estado ||
                      "Registrado"}
                  </strong>
                </div>
              </div>

              <div className="duplicado-modal-nota">
                <FiInfo aria-hidden="true" />

                <p>
                  El intento actual fue rechazado y la asistencia original se conserva.
                </p>
              </div>

              {errorRegistroIntento && (
                <p className="duplicado-modal-error-historial" role="alert">
                  {errorRegistroIntento}
                </p>
              )}

              <div className="duplicado-modal-acciones">
                <button
                  type="button"
                  className="duplicado-modal-boton-secundario"
                  onClick={() =>
                    setModalDuplicadoAbierto(false)
                  }
                >
                  Cerrar
                </button>

                <button
                  type="button"
                  className="duplicado-modal-boton-principal"
                  onClick={() =>
                    navigate(
                      "/ingreso/ingresos-registrados",
                      {
                        state: {
                          idIngreso:
                            idIngresoExistente,
                        },
                      }
                    )
                  }
                  disabled={!idIngresoExistente}
                >
                  <FiFileText aria-hidden="true" />

                  Ver registro existente
                </button>
              </div>
            </section>
          </div>
        )}
    </div>
  );
}

export default ResultadoHabilitacion;
