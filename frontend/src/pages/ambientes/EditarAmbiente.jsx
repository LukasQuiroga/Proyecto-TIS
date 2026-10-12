import {useState} from "react";
import {FiSave, FiX} from "react-icons/fi";

import {actualizarAmbiente} from "../../services/ambienteService";

import "./FormularioAmbiente.css";

function EditarAmbiente({
  ambiente,
  onCerrar,
  onExito,
}) {
  const [datos, setDatos] = useState({
    codigo: ambiente.codigo || "",
    nombre: ambiente.nombre || "",
    capacidad:
      ambiente.capacidad ?? "",
    ubicacion:
      ambiente.ubicacion || "",
    disponible:
      Boolean(ambiente.disponible),
  });

  const [guardando, setGuardando] =
    useState(false);

  const [error, setError] =
    useState("");

  const actualizarCampo = (
    campo,
    valor,
  ) => {
    setDatos((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  };

  const manejarActualizacion = async (
    evento,
  ) => {
    evento.preventDefault();
    setError("");

    const codigo =
      datos.codigo.trim().toUpperCase();

    const nombre =
      datos.nombre.trim();

    const ubicacion =
      datos.ubicacion.trim();

    const capacidad =
      Number(datos.capacidad);

    if (
      !codigo ||
      !/^[A-Za-z0-9_-]+$/.test(codigo)
    ) {
      setError(
        "Ingresa un código válido usando letras, números, guion o guion bajo.",
      );
      return;
    }

    if (
      nombre.length < 3 ||
      nombre.length > 100
    ) {
      setError(
        "El nombre debe tener entre 3 y 100 caracteres.",
      );
      return;
    }

    if (
      !Number.isInteger(capacidad) ||
      capacidad <= 0
    ) {
      setError(
        "La capacidad debe ser un número entero mayor a 0.",
      );
      return;
    }

    if (
      ubicacion.length < 3 ||
      ubicacion.length > 150
    ) {
      setError(
        "La ubicación debe tener entre 3 y 150 caracteres.",
      );
      return;
    }

    setGuardando(true);

    try {
      const respuesta =
        await actualizarAmbiente(
          ambiente.idAmbiente,
          {
            codigo,
            nombre,
            capacidad,
            ubicacion,
            disponible:
              datos.disponible,
          },
        );

      onExito(respuesta.data);
    } catch (err) {
      console.error(
        "Error actualizando ambiente:",
        err,
      );

      const mensaje =
        err.response?.data?.mensaje ||
        err.response?.data?.message;

      setError(
        typeof mensaje === "string"
          ? mensaje
          : "No se pudo actualizar el ambiente. Verifica los datos e intenta nuevamente.",
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="formulario-ambiente-fondo">
      <div
        className="formulario-ambiente-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="editar-ambiente-titulo"
      >
        <header className="formulario-ambiente-encabezado">
          <div>
            <h2 id="editar-ambiente-titulo">
              Editar ambiente
            </h2>

            <p>
              Actualiza la información
              del ambiente seleccionado.
            </p>
          </div>

          <button
            type="button"
            className="formulario-ambiente-cerrar"
            aria-label="Cerrar formulario"
            onClick={onCerrar}
            disabled={guardando}
          >
            <FiX/>
          </button>
        </header>

        <form onSubmit={manejarActualizacion}>
          <div className="formulario-ambiente-grid">
            <div className="formulario-ambiente-campo">
              <label htmlFor="editar-ambiente-codigo">
                Código *
              </label>

              <input
                id="editar-ambiente-codigo"
                value={datos.codigo}
                onChange={(e) =>
                  actualizarCampo(
                    "codigo",
                    e.target.value
                      .toUpperCase(),
                  )
                }
                maxLength={30}
                required
                disabled={guardando}
              />
            </div>

            <div className="formulario-ambiente-campo">
              <label htmlFor="editar-ambiente-capacidad">
                Capacidad *
              </label>

              <input
                id="editar-ambiente-capacidad"
                type="number"
                min="1"
                step="1"
                value={datos.capacidad}
                onChange={(e) =>
                  actualizarCampo(
                    "capacidad",
                    e.target.value,
                  )
                }
                required
                disabled={guardando}
              />
            </div>
          </div>

          <div className="formulario-ambiente-campo">
            <label htmlFor="editar-ambiente-nombre">
              Nombre *
            </label>

            <input
              id="editar-ambiente-nombre"
              value={datos.nombre}
              onChange={(e) =>
                actualizarCampo(
                  "nombre",
                  e.target.value,
                )
              }
              minLength={3}
              maxLength={100}
              required
              disabled={guardando}
            />
          </div>

          <div className="formulario-ambiente-campo">
            <label htmlFor="editar-ambiente-ubicacion">
              Ubicación *
            </label>

            <input
              id="editar-ambiente-ubicacion"
              value={datos.ubicacion}
              onChange={(e) =>
                actualizarCampo(
                  "ubicacion",
                  e.target.value,
                )
              }
              minLength={3}
              maxLength={150}
              required
              disabled={guardando}
            />
          </div>

          <div className="formulario-ambiente-campo">
            <label htmlFor="editar-ambiente-estado">
              Estado *
            </label>

            <select
              id="editar-ambiente-estado"
              value={
                datos.disponible
                  ? "DISPONIBLE"
                  : "NO_DISPONIBLE"
              }
              onChange={(e) =>
                actualizarCampo(
                  "disponible",
                  e.target.value ===
                    "DISPONIBLE",
                )
              }
              disabled={guardando}
            >
              <option value="DISPONIBLE">
                Disponible
              </option>

              <option value="NO_DISPONIBLE">
                No disponible
              </option>
            </select>
          </div>

          {error && (
            <div
              className="formulario-ambiente-error"
              role="alert"
            >
              {error}
            </div>
          )}

          <footer className="formulario-ambiente-acciones">
            <button
              type="button"
              className="formulario-ambiente-cancelar"
              onClick={onCerrar}
              disabled={guardando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="formulario-ambiente-guardar"
              disabled={guardando}
            >
              <FiSave/>

              {guardando
                ? "Guardando..."
                : "Guardar cambios"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

export default EditarAmbiente;