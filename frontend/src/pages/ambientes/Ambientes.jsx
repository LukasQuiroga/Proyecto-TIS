import {useEffect, useMemo, useState} from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
  FiEye,
  FiMapPin,
  FiPlus,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";

import {obtenerAmbientes} from "../../services/ambienteService";
import DetalleAmbiente from "./DetalleAmbiente.jsx";
import EditarAmbiente from "./EditarAmbiente.jsx";
import RegistrarAmbiente from "./RegistrarAmbiente.jsx";

import "./Ambientes.css";

const TAMANO_PAGINA = 10;

function Ambientes() {
  const [ambientes, setAmbientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [buscar, setBuscar] = useState("");
  const [estado, setEstado] = useState("TODOS");
  const [pagina, setPagina] = useState(1);

  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [ambienteDetalle, setAmbienteDetalle] = useState(null);
  const [ambienteEditar, setAmbienteEditar] = useState(null);
  const [mensajeExito, setMensajeExito] = useState("");

  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    let activo = true;

    obtenerAmbientes()
      .then((respuesta) => {
        if (!activo) return;
        setAmbientes(Array.isArray(respuesta.data) ? respuesta.data : []);
        setError("");
      })
      .catch((err) => {
        if (!activo) return;
        console.error("Error cargando ambientes:", err);
        setError("No se pudieron cargar los ambientes. Intenta nuevamente.");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [recarga]);

  const cargarAmbientes = () => {
    setCargando(true);
    setError("");
    setRecarga((actual) => actual + 1);
  };

  const ambientesFiltrados = useMemo(() => {
    const texto = buscar
      .trim()
      .toLocaleLowerCase("es");

    return ambientes.filter((ambiente) => {
      const coincideBusqueda =
        !texto ||
        (ambiente.codigo || "")
          .toLocaleLowerCase("es")
          .includes(texto) ||
        (ambiente.nombre || "")
          .toLocaleLowerCase("es")
          .includes(texto) ||
        (ambiente.ubicacion || "")
          .toLocaleLowerCase("es")
          .includes(texto);

      const coincideEstado =
        estado === "TODOS" ||
        (
          estado === "DISPONIBLE" &&
          ambiente.disponible
        ) ||
        (
          estado === "NO_DISPONIBLE" &&
          !ambiente.disponible
        );

      return (
        coincideBusqueda &&
        coincideEstado
      );
    });
  }, [ambientes, buscar, estado]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(
      ambientesFiltrados.length /
        TAMANO_PAGINA,
    ),
  );

  const paginaActual = Math.min(
    pagina,
    totalPaginas,
  );

  const ambientesPagina =
    ambientesFiltrados.slice(
      (paginaActual - 1) * TAMANO_PAGINA,
      paginaActual * TAMANO_PAGINA,
    );

  const actualizarBusqueda = (valor) => {
    setBuscar(valor);
    setPagina(1);
  };

  const actualizarEstado = (valor) => {
    setEstado(valor);
    setPagina(1);
  };

  const abrirEdicion = (ambiente) => {
    setAmbienteDetalle(null);
    setAmbienteEditar(ambiente);
  };

  const manejarRegistroExitoso = () => {
    setMostrarRegistro(false);

    setMensajeExito(
      "El ambiente se registró correctamente.",
    );

    cargarAmbientes();
  };

  const manejarEdicionExitosa = () => {
    setAmbienteEditar(null);

    setMensajeExito(
      "Los datos del ambiente se actualizaron correctamente.",
    );

    cargarAmbientes();
  };

  return (
    <div className="ambientes-pagina">
      <header className="ambientes-encabezado">
        <div>
          <h1>Ambientes</h1>

          <p>
            Gestiona los ambientes que se utilizarán durante
            la organización de los exámenes.
          </p>
        </div>

        <button
          type="button"
          className="ambientes-boton-principal"
          onClick={() =>
            setMostrarRegistro(true)
          }
        >
          <FiPlus/>
          Nuevo ambiente
        </button>
      </header>

      <section className="ambientes-filtros">
        <div className="ambientes-buscador">
          <FiSearch/>

          <input
            type="search"
            placeholder="Buscar por código, nombre o ubicación..."
            aria-label="Buscar ambientes"
            value={buscar}
            maxLength={150}
            onChange={(e) =>
              actualizarBusqueda(
                e.target.value,
              )
            }
          />
        </div>

        <select
          aria-label="Filtrar ambientes por estado"
          value={estado}
          onChange={(e) =>
            actualizarEstado(
              e.target.value,
            )
          }
        >
          <option value="TODOS">
            Todos los estados
          </option>

          <option value="DISPONIBLE">
            Disponibles
          </option>

          <option value="NO_DISPONIBLE">
            No disponibles
          </option>
        </select>

        <button
          type="button"
          className="ambientes-boton-recargar"
          onClick={cargarAmbientes}
          disabled={cargando}
          aria-label="Actualizar listado"
          title="Actualizar listado"
        >
          <FiRefreshCw/>
        </button>
      </section>

      {error && (
        <div
          className="ambientes-error"
          role="alert"
        >
          {error}
        </div>
      )}

      <section className="ambientes-panel">
        <div className="ambientes-tabla-contenedor">
          <table className="ambientes-tabla">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Capacidad</th>
                <th>Ubicación</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {cargando ? (
                <tr>
                  <td
                    colSpan={6}
                    className="ambientes-mensaje-tabla"
                  >
                    Cargando ambientes...
                  </td>
                </tr>
              ) : ambientesPagina.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="ambientes-mensaje-tabla"
                  >
                    <FiMapPin size={28}/>

                    <span>
                      {ambientes.length === 0
                        ? "No hay ambientes registrados."
                        : "No se encontraron ambientes con los filtros seleccionados."}
                    </span>
                  </td>
                </tr>
              ) : (
                ambientesPagina.map(
                  (ambiente) => (
                    <tr
                      key={
                        ambiente.idAmbiente
                      }
                    >
                      <td className="ambientes-codigo">
                        {ambiente.codigo}
                      </td>

                      <td>
                        {ambiente.nombre}
                      </td>

                      <td>
                        {ambiente.capacidad}
                      </td>

                      <td>
                        {ambiente.ubicacion}
                      </td>

                      <td>
                        <span
                          className={
                            ambiente.disponible
                              ? "ambientes-estado disponible"
                              : "ambientes-estado no-disponible"
                          }
                        >
                          {ambiente.disponible
                            ? "Disponible"
                            : "No disponible"}
                        </span>
                      </td>

                      <td>
                        <div className="ambientes-acciones-tabla">
                          <button
                            type="button"
                            className="ambientes-boton-accion"
                            onClick={() =>
                              setAmbienteDetalle(
                                ambiente,
                              )
                            }
                            title="Ver ambiente"
                            aria-label={`Ver ${ambiente.nombre}`}
                          >
                            <FiEye/>
                          </button>

                          <button
                            type="button"
                            className="ambientes-boton-accion editar"
                            onClick={() =>
                              abrirEdicion(
                                ambiente,
                              )
                            }
                            title="Editar ambiente"
                            aria-label={`Editar ${ambiente.nombre}`}
                          >
                            <FiEdit2/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ),
                )
              )}
            </tbody>
          </table>
        </div>

        <footer className="ambientes-pie">
          <span>
            Mostrando{" "}
            {ambientesFiltrados.length} de{" "}
            {ambientes.length} ambientes
          </span>

          <div className="ambientes-paginacion">
            <button
              type="button"
              aria-label="Página anterior"
              disabled={
                paginaActual <= 1
              }
              onClick={() =>
                setPagina(
                  paginaActual - 1,
                )
              }
            >
              <FiChevronLeft/>
            </button>

            <span>
              {paginaActual} /{" "}
              {totalPaginas}
            </span>

            <button
              type="button"
              aria-label="Página siguiente"
              disabled={
                paginaActual >=
                totalPaginas
              }
              onClick={() =>
                setPagina(
                  paginaActual + 1,
                )
              }
            >
              <FiChevronRight/>
            </button>
          </div>
        </footer>
      </section>

      {mostrarRegistro && (
        <RegistrarAmbiente
          onCerrar={() =>
            setMostrarRegistro(false)
          }
          onExito={
            manejarRegistroExitoso
          }
        />
      )}

      {ambienteDetalle && (
        <DetalleAmbiente
          ambiente={ambienteDetalle}
          onCerrar={() =>
            setAmbienteDetalle(null)
          }
          onEditar={abrirEdicion}
        />
      )}

      {ambienteEditar && (
        <EditarAmbiente
          ambiente={ambienteEditar}
          onCerrar={() =>
            setAmbienteEditar(null)
          }
          onExito={
            manejarEdicionExitosa
          }
        />
      )}

      {mensajeExito && (
        <div className="ambientes-modal-fondo">
          <div
            className="ambientes-modal-exito"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ambiente-exito-titulo"
          >
            <div className="ambientes-exito-icono">
              ✓
            </div>

            <h2 id="ambiente-exito-titulo">
              Operación completada
            </h2>

            <p>{mensajeExito}</p>

            <button
              type="button"
              className="ambientes-boton-principal"
              onClick={() =>
                setMensajeExito("")
              }
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Ambientes;