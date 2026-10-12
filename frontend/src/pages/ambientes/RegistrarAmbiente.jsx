import {useState} from "react";
import {FiPlus, FiX} from "react-icons/fi";

import {registrarAmbiente} from "../../services/ambienteService";

import "./FormularioAmbiente.css";

const DATOS_INICIALES = {
  codigo: "",
  nombre: "",
  capacidad: "",
  ubicacion: "",
  disponible: true,
};

function RegistrarAmbiente({onCerrar, onExito}) {
  const [datos, setDatos] =
    useState(DATOS_INICIALES);

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

  const manejarRegistro = async (
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
        await registrarAmbiente({
          codigo,
          nombre,
          capacidad,
          ubicacion,
          disponible:
            datos.disponible,
        });

      if (respuesta.status === 201) {
        onExito(respuesta.data);
      }
    } catch (err) {
      console.error(
        "Error registrando ambiente:",
        err,
      );

      const mensaje =
        err.response?.data?.mensaje ||
        err.response?.data?.message;

      setError(
        typeof mensaje === "string"
          ? mensaje
          : "No se pudo registrar el ambiente. Verifica los datos e intenta nuevamente.",
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
        aria-labelledby="registrar-ambiente-titulo"
      >
        <header className="formulario-ambiente-encabezado">
          <div>
            <h2 id="registrar-ambiente-titulo">
              Nuevo ambiente
            </h2>

            <p>
              Completa la información
              del ambiente.
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

        <form onSubmit={manejarRegistro}>
          <div className="formulario-ambiente-grid">
            <div className="formulario-ambiente-campo">
              <label htmlFor="ambiente-codigo">
                Código *
              </label>

              <input
                id="ambiente-codigo"
                value={datos.codigo}
                onChange={(e) =>
                  actualizarCampo(
                    "codigo",
                    e.target.value
                      .toUpperCase(),
                  )
                }
                placeholder="Ej. A-101"
                maxLength={30}
                required
                disabled={guardando}
              />
            </div>

            <div className="formulario-ambiente-campo">
              <label htmlFor="ambiente-capacidad">
                Capacidad *
              </label>

              <input
                id="ambiente-capacidad"
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
                placeholder="Ej. 40"
                required
                disabled={guardando}
              />
            </div>
          </div>

          <div className="formulario-ambiente-campo">
            <label htmlFor="ambiente-nombre">
              Nombre *
            </label>

            <input
              id="ambiente-nombre"
              value={datos.nombre}
              onChange={(e) =>
                actualizarCampo(
                  "nombre",
                  e.target.value,
                )
              }
              placeholder="Ej. Aula 101"
              minLength={3}
              maxLength={100}
              required
              disabled={guardando}
            />
          </div>

          <div className="formulario-ambiente-campo">
            <label htmlFor="ambiente-ubicacion">
              Ubicación *
            </label>

            <input
              id="ambiente-ubicacion"
              value={datos.ubicacion}
              onChange={(e) =>
                actualizarCampo(
                  "ubicacion",
                  e.target.value,
                )
              }
              placeholder="Ej. Bloque A - Piso 1"
              minLength={3}
              maxLength={150}
              required
              disabled={guardando}
            />
          </div>

          <div className="formulario-ambiente-campo">
            <label htmlFor="ambiente-estado">
              Estado *
            </label>

            <select
              id="ambiente-estado"
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
              <FiPlus/>

              {guardando
                ? "Guardando..."
                : "Guardar ambiente"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

export default RegistrarAmbiente;