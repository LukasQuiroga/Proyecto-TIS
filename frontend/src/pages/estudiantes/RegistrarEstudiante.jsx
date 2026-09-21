import "./RegistrarEstudiante.css";

function RegistrarEstudiante() {
  return (
    <div className="registro-estudiante">

      <div className="registro-estudiante-encabezado">
        <h1>Registro de estudiantes</h1>

        <p>
          Registra estudiantes para la planificación y ejecución de los
          exámenes.
        </p>
      </div>

      <section className="registro-estudiante-panel">
        <div className="registro-estudiante-panel-encabezado">
          <h2>Datos del estudiante</h2>

          <p>
            <span className="registro-estudiante-obligatorio">*</span>
            Los campos con asterisco son obligatorios.
          </p>
        </div>

        <form className="registro-estudiante-formulario">
          <div className="registro-estudiante-campo">
            <label htmlFor="codigoSiss">
              Código SISS
              <span className="registro-estudiante-obligatorio">
                *
              </span>
            </label>

            <input
              id="codigoSiss"
              name="codigoSiss"
              type="text"
              placeholder="Ej 202012345"
            />
          </div>

          <div className="registro-estudiante-campo">
            <label htmlFor="documentoIdentidad">
              Documento de identidad
              <span className="registro-estudiante-obligatorio">
                *
              </span>
            </label>

            <input
              id="documentoIdentidad"
              name="documentoIdentidad"
              type="text"
              placeholder="Ej 12345678"
            />
          </div>

          <div className="registro-estudiante-campo">
            <label htmlFor="nombres">
              Nombres
              <span className="registro-estudiante-obligatorio">
                *
              </span>
            </label>

            <input
              id="nombres"
              name="nombres"
              type="text"
              placeholder="Ej Juan Carlos"
            />
          </div>

          <div className="registro-estudiante-campo">
            <label htmlFor="apellidos">
              Apellidos
              <span className="registro-estudiante-obligatorio">
                *
              </span>
            </label>

            <input
              id="apellidos"
              name="apellidos"
              type="text"
              placeholder="Ej Pérez García"
            />
          </div>

          <div className="registro-estudiante-campo">
            <label htmlFor="correoElectronico">
              Correo electrónico
              <span className="registro-estudiante-obligatorio">
                *
              </span>
            </label>

            <input
              id="correoElectronico"
              name="correoElectronico"
              type="email"
              placeholder="Ej codigosiss@umss.edu.bo"
            />
          </div>

          <div className="registro-estudiante-campo">
            <label htmlFor="telefono">
              Teléfono
            </label>

            <input
              id="telefono"
              name="telefono"
              type="tel"
              placeholder="Ej 70712345"
            />
          </div>

          <div className="registro-estudiante-campo">
            <label htmlFor="carrera">
              Carrera
              <span className="registro-estudiante-obligatorio">
                *
              </span>
            </label>

            <select
              id="carrera"
              name="carrera"
              defaultValue=""
            >
              <option value="" disabled>
                Seleccione una carrera
              </option>

              <option value="ingenieria-informatica">
                Ingeniería Informática
              </option>

              <option value="ingenieria-sistemas">
                Ingeniería de Sistemas
              </option>
            </select>
          </div>

          <div className="registro-estudiante-acciones">
            <button
              type="reset"
              className="registro-estudiante-boton-secundario"
            >
              Limpiar
            </button>

            <button
              type="button"
              className="registro-estudiante-boton-principal"
            >
              Guardar estudiante
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default RegistrarEstudiante;