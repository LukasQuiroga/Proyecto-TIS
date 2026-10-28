import { useEffect, useState } from "react";
import { consultarHabilitacion } from "../../services/validacionHabilitacionService";
import "./ValidarHabilitacion.css";

function ResultadoHabilitacion({
  idExamen,
  idEstudiante,
  nombreExamen,
  nombreEstudiante,
}) {
    const [consulta, setConsulta] = useState(null);
    const [intento, setIntento] = useState(0);
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
        const datos = await consultarHabilitacion(
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
    </div>
  );
}

export default ResultadoHabilitacion;
