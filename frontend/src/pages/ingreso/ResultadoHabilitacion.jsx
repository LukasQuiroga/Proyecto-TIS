import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiAlertCircle, FiFileText, FiInfo, FiX } from "react-icons/fi";
import {
  verificarIngresoYRegistrarRechazo,
  consultarIngresoRegistrado,
  obtenerIngresoRegistrado,
  registrarIntentoIngresoDuplicado,
  registrarIngresoExamen,
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
    const [intento, setIntento] = useState(0);
    const [estadoIngreso, setEstadoIngreso] = useState(null);
    const [guardandoIngreso, setGuardandoIngreso] = useState(false);
    const [modalDuplicadoAbierto, setModalDuplicadoAbierto] = useState(false);
    const [errorRegistroIntento, setErrorRegistroIntento] = useState("");
    const intentosDuplicadosEnviados = useRef(new Set());

    useEffect(() => {
      if (!modalDuplicadoAbierto) return undefined;
      const overflowAnterior = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const cerrarConEscape = (evento) => {
        if (evento.key === "Escape") setModalDuplicadoAbierto(false);
      };
      window.addEventListener("keydown", cerrarConEscape);
      return () => {
        document.body.style.overflow = overflowAnterior;
        window.removeEventListener("keydown", cerrarConEscape);
      };
    }, [modalDuplicadoAbierto]);
    const consultaActual =
    consulta?.intento === intento &&
    Number(consulta?.idExamen) === Number(idExamen) &&
    Number(consulta?.idEstudiante) === Number(idEstudiante);

    const resultado = consultaActual ? consulta.resultado : null;
    const error = consultaActual ? consulta.error : "";
    const cargando = !consultaActual;

    useEffect(() => {
    let activo = true;

    async function validar() {
        try {
        const datos = await verificarIngresoYRegistrarRechazo(
            Number(idExamen),
            Number(idEstudiante),
        );

        if (!activo) return;

        const estadosValidos = [
            "HABILITADO",
            "INHABILITADO",
            "SIN_ESTADO",
            "NO_ASOCIADO",
        ];

        if (
            Number(datos?.idExamen) !== Number(idExamen) ||
            Number(datos?.idEstudiante) !== Number(idEstudiante) ||
            !estadosValidos.includes(datos?.estado) ||
            typeof datos?.puedeContinuar !== "boolean" ||
            (datos.estado !== "HABILITADO" && datos.puedeContinuar)
        ) {
            setConsulta({
            intento,
            idExamen,
            idEstudiante,
            resultado: null,
            error: "El servidor devolvió una validación incompleta o inconsistente.",
            });
            return;
        }

        setConsulta({
            intento,
            idExamen,
            idEstudiante,
            resultado: datos,
            error: "",
        });
        } catch (err) {
        if (!activo) return;

        setConsulta({
            intento,
            idExamen,
            idEstudiante,
            resultado: null,
            error:
            err.response?.data?.mensaje ||
            err.response?.data?.message ||
            "No se pudo completar la validación. Verifique la conexión.",
        });
        }
    }

    validar();

    return () => {
        activo = false;
    };
    }, [idExamen, idEstudiante, intento]);

  const habilitado =
    resultado?.estado === "HABILITADO" &&
    resultado?.puedeContinuar === true;

  const claveIngreso = `${idExamen}:${idEstudiante}:${intento}`;
  const ingresoActual = estadoIngreso?.clave === claveIngreso ? estadoIngreso : null;

  useEffect(() => {
    if (!habilitado) return;
    let activo = true;
    consultarIngresoRegistrado(Number(idExamen), Number(idEstudiante))
      .then((datos) => {
        if (activo) {
          setEstadoIngreso({
            clave: `${idExamen}:${idEstudiante}:${intento}`,
            registrado: datos.ingresoRegistrado === true,
            datos,
            detalle: null,
            error: "",
          });
          if (datos.ingresoRegistrado === true) {
            setModalDuplicadoAbierto(true);
            const claveIntento = `${idExamen}:${idEstudiante}:${intento}`;
            if (!intentosDuplicadosEnviados.current.has(claveIntento)) {
              intentosDuplicadosEnviados.current.add(claveIntento);
              registrarIntentoIngresoDuplicado(Number(idExamen), Number(idEstudiante))
                .then(() => setErrorRegistroIntento(""))
                .catch((err) => {
                  intentosDuplicadosEnviados.current.delete(claveIntento);
                  if (activo) {
                    setErrorRegistroIntento(
                      err.response?.data?.mensaje || err.response?.data?.message ||
                      "No se pudo guardar el intento rechazado en el historial.",
                    );
                  }
                });
            }
            if (datos.idIngreso) {
              obtenerIngresoRegistrado(datos.idIngreso)
                .then((detalle) => {
                  if (activo) {
                    setEstadoIngreso((actual) => actual?.clave === `${idExamen}:${idEstudiante}:${intento}`
                      ? { ...actual, detalle }
                      : actual);
                  }
                })
                .catch(() => null);
            }
          }
        }
      })
      .catch((err) => {
        if (activo) {
          setEstadoIngreso({
            clave: `${idExamen}:${idEstudiante}:${intento}`,
            registrado: false,
            datos: null,
            detalle: null,
            error: err.response?.data?.mensaje || err.response?.data?.message ||
              "No se pudo verificar si el estudiante ya ingresó.",
          });
        }
      });
    return () => { activo = false; };
  }, [habilitado, idExamen, idEstudiante, intento]);

  const registrarAsistencia = async () => {
    if (!habilitado || guardandoIngreso || !ingresoActual ||
        ingresoActual.registrado || ingresoActual.error) return;
    setGuardandoIngreso(true);
    try {
      const datos = await registrarIngresoExamen(Number(idExamen), Number(idEstudiante));
      setEstadoIngreso({ clave: claveIngreso, registrado: true, datos, detalle: null, error: "" });
    } catch (err) {
      const duplicado = err.response?.status === 409;
      setErrorRegistroIntento("");
      setEstadoIngreso({
        clave: claveIngreso,
        registrado: duplicado,
        datos: null,
        detalle: null,
        error: duplicado
          ? "Este estudiante ya tiene un ingreso registrado para este examen."
          : err.response?.data?.mensaje || err.response?.data?.message ||
            "No se pudo registrar el ingreso. Verifique la conexión.",
      });
      if (duplicado) {
        setModalDuplicadoAbierto(true);
        consultarIngresoRegistrado(Number(idExamen), Number(idEstudiante))
          .then((registro) => registro.idIngreso
            ? obtenerIngresoRegistrado(registro.idIngreso)
            : null)
          .then((detalle) => {
            if (detalle) {
              setEstadoIngreso((actual) => actual?.clave === claveIngreso
                ? { ...actual, datos: actual.datos || detalle, detalle }
                : actual);
            }
          })
          .catch(() => null);
      }
    } finally {
      setGuardandoIngreso(false);
    }
  };

  return (
    <div className="validacion-integrada">
      <section className="validacion-panel">
        <h2>Validación de habilitación</h2>

        <p>
          Comprobación de habilitación del estudiante identificado
          para el examen seleccionado.
        </p>

        <button
          type="button"
          className="validacion-boton"
          disabled={cargando}
          onClick={() => setIntento((actual) => actual + 1)}
        >
          {cargando ? "Validando..." : "Volver a validar"}
        </button>
      </section>

      {cargando && (
        <section className="validacion-resultado" role="status">
          <h2>Validando habilitación...</h2>
          <p>Consultando el estado del estudiante.</p>
        </section>
      )}

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
              <strong>Examen:</strong> {nombreExamen || idExamen}
            </p>

            <p>
              <strong>Estudiante:</strong>{" "}
              {nombreEstudiante || idEstudiante}
            </p>

            <p>
              <strong>Estado:</strong> {resultado.estado}
            </p>
          </div>

          <p>{resultado.mensaje}</p>

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

      {!cargando && habilitado && (
        <section className="validacion-panel" aria-live="polite">
          <h2>Registro de asistencia — HU22</h2>
          {!ingresoActual ? (
            <p>Comprobando si el estudiante ya tiene un ingreso registrado...</p>
          ) : ingresoActual.registrado ? (
            <p className="validacion-ayuda">Este estudiante ya tiene un ingreso registrado para este examen.</p>
          ) : (
            <>
              {ingresoActual.error && <p role="alert" className="ingreso-ya-registrado">{ingresoActual.error}</p>}
              <button type="button" className="validacion-boton"
                disabled={guardandoIngreso || Boolean(ingresoActual.error)}
                onClick={registrarAsistencia}>
                {guardandoIngreso ? "Registrando..." : "Registrar ingreso / asistencia"}
              </button>
              <p className="validacion-ayuda">La habilitación y el permiso del docente se vuelven a comprobar en el servidor.</p>
            </>
          )}
        </section>
      )}

      {habilitado && ingresoActual?.registrado && modalDuplicadoAbierto && (
        <div
          className="duplicado-modal-overlay"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) setModalDuplicadoAbierto(false);
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
              onClick={() => setModalDuplicadoAbierto(false)}
              aria-label="Cerrar aviso"
            >
              <FiX aria-hidden="true" />
            </button>

            <div className="duplicado-modal-icono" aria-hidden="true">
              <FiAlertCircle />
            </div>
            <h2 id="duplicado-titulo">Registro no permitido</h2>
            <p className="duplicado-modal-subtitulo">Se detectó un intento de ingreso duplicado.</p>
            <p id="duplicado-descripcion" className="duplicado-modal-descripcion">
              {nombreEstudiante || `El estudiante ${idEstudiante}`} ya registró su ingreso
              {nombreExamen ? ` en el examen ${nombreExamen}` : " para este examen"}.
              {ingresoActual.detalle?.fechaHoraIngreso || ingresoActual.datos?.fechaHoraIngreso
                ? ` El registro original se realizó el ${new Date(ingresoActual.detalle?.fechaHoraIngreso || ingresoActual.datos?.fechaHoraIngreso).toLocaleString()}.`
                : " El registro original se conserva en el sistema."}
            </p>

            <div className="duplicado-modal-datos">
              <div>
                <span>Código</span>
                <strong>{ingresoActual.detalle?.codigoUniversitario || codigoEstudiante || "—"}</strong>
              </div>
              <div>
                <span>Examen</span>
                <strong>{ingresoActual.detalle?.nombreExamen || nombreExamen || `Examen ${idExamen}`}</strong>
              </div>
              <div>
                <span>Estado del ingreso existente</span>
                <strong className="duplicado-modal-estado">{ingresoActual.detalle?.estado || "Registrado"}</strong>
              </div>
            </div>

            <div className="duplicado-modal-nota">
              <FiInfo aria-hidden="true" />
              <p>Este intento de ingreso fue rechazado.</p>
            </div>
            {errorRegistroIntento && (
              <p className="duplicado-modal-error-historial" role="alert">
                {errorRegistroIntento}
              </p>
            )}

            <div className="duplicado-modal-acciones">
              <button type="button" className="duplicado-modal-boton-secundario" onClick={() => setModalDuplicadoAbierto(false)}>
                Cerrar
              </button>
              <button
                type="button"
                className="duplicado-modal-boton-principal"
                onClick={() => navigate("/ingreso/ingresos-registrados", {
                  state: { idIngreso: ingresoActual.detalle?.idIngreso || ingresoActual.datos?.idIngreso },
                })}
                disabled={!(ingresoActual.detalle?.idIngreso || ingresoActual.datos?.idIngreso)}
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
