
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FiAlertCircle, FiCheckCircle, FiClipboard, FiEdit2,
  FiEye, FiRefreshCw, FiSearch, FiX
} from "react-icons/fi";
import {
  actualizarHabilitacion,
  consultarHabilitacion,
  listarHabilitaciones,
  listarMotivos,
  mensajeErrorHabilitacion
} from "../../services/habilitacionService";
import "./Habilitaciones.css";

const POR_PAGINA = 10;
const fecha = (valor) =>
  valor ? new Date(valor).toLocaleString("es-BO") : "Sin modificaciones";

function ModalHabilitacion({
  estudiante, motivos, modo, onCerrar, onGuardar, guardando
}) {
  const [estado, setEstado] = useState(estudiante.estado);
  const [idMotivo, setIdMotivo] = useState(
    estudiante.idMotivo ? String(estudiante.idMotivo) : ""
  );
  const [error, setError] = useState("");
  const editable = modo === "editar";

  useEffect(() => {
    const cerrarConEscape = (e) => {
      if (e.key === "Escape" && !guardando) onCerrar();
    };
    document.addEventListener("keydown", cerrarConEscape);
    return () => document.removeEventListener("keydown", cerrarConEscape);
  }, [onCerrar, guardando]);

  const guardar = async (event) => {
    event.preventDefault();
    if (estado === "INHABILITADO" && !idMotivo) {
      setError("Debes seleccionar un motivo de inhabilitación.");
      return;
    }
    setError("");
    try {
      await onGuardar({
        idEstudiante: estudiante.idEstudiante,
        estado,
        idMotivo: estado === "INHABILITADO" ? Number(idMotivo) : null,
        numeroCambios: estudiante.numeroCambios ?? 0
      });
    } catch (err) {
      setError(mensajeErrorHabilitacion(err));
    }
  };

  return (
    <div
      className="hab-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !guardando) onCerrar();
      }}
    >
      <section
        className="hab-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hab-modal-titulo"
      >
        <header className="hab-modal-header">
          <div>
            <h2 id="hab-modal-titulo">
              {editable ? "Modificar habilitación" : "Detalle de habilitación"}
            </h2>
            <p>{estudiante.nombreEstudiante}</p>
          </div>
          <button
            type="button"
            className="hab-icono"
            onClick={onCerrar}
            disabled={guardando}
            aria-label="Cerrar"
          >
            <FiX />
          </button>
        </header>

        <form onSubmit={guardar}>
          <div className="hab-modal-body">
            <dl className="hab-detalles">
              <div>
                <dt>Código universitario</dt>
                <dd>{estudiante.codigoUniversitario || "—"}</dd>
              </div>
              <div>
                <dt>Examen</dt>
                <dd>{estudiante.nombreExamen || `#${estudiante.idExamen}`}</dd>
              </div>
              <div>
                <dt>Última modificación</dt>
                <dd>{fecha(estudiante.fechaActualizacion)}</dd>
              </div>
              <div>
                <dt>ID del responsable</dt>
                <dd>{estudiante.idUsuarioResponsable ?? "Sin modificaciones"}</dd>
              </div>
              <div>
                <dt># Cambios</dt>
                <dd>{estudiante.numeroCambios ?? 0}</dd>
              </div>
            </dl>

            <label className="hab-campo">
              Estado
              <select
                disabled={!editable || guardando}
                value={estado}
                onChange={(e) => {
                  setEstado(e.target.value);
                  setIdMotivo("");
                }}
              >
                <option value="HABILITADO">Habilitado</option>
                <option value="INHABILITADO">Inhabilitado</option>
              </select>
            </label>

            {estado === "INHABILITADO" && (
              <label className="hab-campo">
                Motivo de inhabilitación
                {editable ? (
                  <select
                    disabled={guardando}
                    value={idMotivo}
                    required
                    onChange={(e) => setIdMotivo(e.target.value)}
                  >
                    <option value="">Selecciona un motivo</option>
                    {motivos.map((motivo) => (
                      <option key={motivo.idMotivo} value={motivo.idMotivo}>
                        {motivo.titulo}
                      </option>
                    ))}
                    {estudiante.idMotivo &&
                      !motivos.some(
                        (m) => String(m.idMotivo) === String(estudiante.idMotivo)
                      ) && (
                        <option value={estudiante.idMotivo}>
                          {estudiante.tituloMotivo || "Motivo anterior (inactivo)"}
                        </option>
                      )}
                  </select>
                ) : (
                  <div className="hab-valor">
                    {estudiante.tituloMotivo || "Motivo no disponible"}
                  </div>
                )}
              </label>
            )}

            {estado === "INHABILITADO" && estudiante.motivo && (
              <p className="hab-descripcion">{estudiante.motivo}</p>
            )}

            {error && (
              <p className="hab-error" role="alert">
                <FiAlertCircle /> {error}
              </p>
            )}
          </div>

          <footer className="hab-modal-footer">
            <button
              type="button"
              className="hab-btn hab-btn-sec"
              onClick={onCerrar}
              disabled={guardando}
            >
              {editable ? "Cancelar" : "Cerrar"}
            </button>
            {editable && (
              <button
                type="submit"
                className="hab-btn hab-btn-pri"
                disabled={
                  guardando ||
                  (estado === estudiante.estado &&
                    (estado === "HABILITADO" ||
                      String(estudiante.idMotivo) === idMotivo))
                }
              >
                {guardando ? "Guardando…" : "Guardar cambios"}
              </button>
            )}
          </footer>
        </form>
      </section>
    </div>
  );
}

export default function Habilitaciones() {
  const [params, setParams] = useSearchParams();
  const [idIngresado, setIdIngresado] = useState(params.get("examen") || "");
  const idExamen = params.get("examen") || "";
  const [estudiantes, setEstudiantes] = useState([]);
  const [motivos, setMotivos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("");
  const [pagina, setPagina] = useState(1);
  const [modal, setModal] = useState(null);

  const cargar = async (id) => {
    if (!id) {
      setEstudiantes([]);
      return;
    }
    setCargando(true);
    setError("");
    setExito("");
    try {
      const [lista, catalogo] = await Promise.all([
        listarHabilitaciones(id),
        listarMotivos()
      ]);
      setEstudiantes(Array.isArray(lista) ? lista : []);
      setMotivos(Array.isArray(catalogo) ? catalogo : []);
    } catch (err) {
      setEstudiantes([]);
      setError(mensajeErrorHabilitacion(err));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar(idExamen);
  }, [idExamen]);

  const filtrados = useMemo(
    () =>
      estudiantes.filter((e) => {
        const texto =
          `${e.nombreEstudiante || ""} ${e.codigoUniversitario || ""}`.toLowerCase();
        return (
          texto.includes(busqueda.trim().toLowerCase()) &&
          (!filtro || e.estado === filtro)
        );
      }),
    [estudiantes, busqueda, filtro]
  );

  const paginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, paginas);
  const vista = filtrados.slice(
    (paginaActual - 1) * POR_PAGINA,
    paginaActual * POR_PAGINA
  );

  const abrir = async (estudiante, modo) => {
    setError("");
    try {
      const detalle = await consultarHabilitacion(
        idExamen,
        estudiante.idEstudiante
      );
      setModal({ estudiante: detalle, modo });
    } catch (err) {
      setError(mensajeErrorHabilitacion(err));
    }
  };

  const guardar = async (payload) => {
    setGuardando(true);
    try {
      await actualizarHabilitacion(idExamen, payload);
      setModal(null);
      await cargar(idExamen);
      setExito("La habilitación se actualizó correctamente.");
    } catch (err) {
      if (err?.response?.status === 409) {
        setModal(null);
        await cargar(idExamen);
      }
      throw err;
    } finally {
      setGuardando(false);
    }
  };

  return (
    <main className="hab-pagina">
      <header className="hab-encabezado">
        <div>
          <h1>Habilitaciones de estudiantes</h1>
          <p>
            Gestiona el estado de cada estudiante para un examen de tu materia y grupo.
          </p>
        </div>
      </header>

      <section className="hab-panel hab-seleccion">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const valor = idIngresado.trim();
            if (!/^[1-9]\d*$/.test(valor)) {
              setError("Introduce un ID de examen válido.");
              return;
            }
            setPagina(1);
            setParams({ examen: valor });
            if (idExamen === valor) cargar(valor);
          }}
        >
          <label htmlFor="hab-examen">ID del examen</label>
          <input
            id="hab-examen"
            type="number"
            min="1"
            step="1"
            placeholder="Ej. 12"
            value={idIngresado}
            onChange={(e) => setIdIngresado(e.target.value)}
          />
          <button className="hab-btn hab-btn-pri" type="submit">
            Consultar examen
          </button>
          <button
            className="hab-btn hab-btn-sec"
            type="button"
            disabled={!idExamen || cargando}
            onClick={() => cargar(idExamen)}
          >
            <FiRefreshCw /> Actualizar
          </button>
        </form>
        <p className="hab-ayuda">
          Introduce el identificador del examen asignado a tu grupo.
          Solo su docente responsable puede consultar y modificar estas habilitaciones.
        </p>
      </section>

      {error && (
        <p className="hab-error" role="alert">
          <FiAlertCircle /> {error}
        </p>
      )}

      {exito && (
        <p className="hab-exito" role="status">
          <FiCheckCircle /> {exito}
        </p>
      )}

      {idExamen && (
        <section className="hab-panel">
          <div className="hab-resumen">
            <div>
              <strong>{estudiantes.length}</strong>
              <span>Estudiantes</span>
            </div>
            <div>
              <strong>
                {estudiantes.filter((e) => e.estado === "HABILITADO").length}
              </strong>
              <span>Habilitados</span>
            </div>
            <div>
              <strong>
                {estudiantes.filter((e) => e.estado === "INHABILITADO").length}
              </strong>
              <span>Inhabilitados</span>
            </div>
          </div>

          <div className="hab-filtros">
            <label className="hab-buscador">
              <FiSearch />
              <input
                type="search"
                placeholder="Buscar por nombre o código..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPagina(1);
                }}
              />
            </label>
            <select
              aria-label="Filtrar estado"
              value={filtro}
              onChange={(e) => {
                setFiltro(e.target.value);
                setPagina(1);
              }}
            >
              <option value="">Todos los estados</option>
              <option value="HABILITADO">Habilitados</option>
              <option value="INHABILITADO">Inhabilitados</option>
            </select>
          </div>

          <div className="hab-tabla-scroll">
            <table className="hab-tabla">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Código</th>
                  <th>Estado</th>
                  <th>Motivo</th>
                  <th># Cambios</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan="6" className="hab-vacio">
                      Cargando estudiantes…
                    </td>
                  </tr>
                ) : vista.length ? (
                  vista.map((e) => (
                    <tr key={e.idEstudiante}>
                      <td>{e.nombreEstudiante}</td>
                      <td>{e.codigoUniversitario || "—"}</td>
                      <td>
                        <span
                          className={`hab-estado ${
                            e.estado === "HABILITADO"
                              ? "hab-habilitado"
                              : "hab-inhabilitado"
                          }`}
                        >
                          {e.estado === "HABILITADO"
                            ? "Habilitado"
                            : "Inhabilitado"}
                        </span>
                      </td>
                      <td>{e.tituloMotivo || "—"}</td>
                      <td>{e.numeroCambios ?? 0}</td>
                      <td>
                        <div className="hab-acciones">
                          <button
                            type="button"
                            title="Ver detalle"
                            aria-label={`Ver ${e.nombreEstudiante}`}
                            onClick={() => abrir(e, "detalle")}
                          >
                            <FiEye />
                          </button>
                          <button
                            type="button"
                            title="Modificar habilitación"
                            aria-label={`Editar ${e.nombreEstudiante}`}
                            onClick={() => abrir(e, "editar")}
                          >
                            <FiEdit2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="hab-vacio">
                      No hay estudiantes que coincidan con los filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <footer className="hab-paginacion">
            <span>
              Mostrando{" "}
              {filtrados.length ? (paginaActual - 1) * POR_PAGINA + 1 : 0}
              {"–"}
              {Math.min(paginaActual * POR_PAGINA, filtrados.length)}
              {" de "}
              {filtrados.length}
            </span>
            <div>
              <button
                type="button"
                disabled={paginaActual <= 1}
                onClick={() => setPagina((v) => v - 1)}
              >
                Anterior
              </button>
              <span>{paginaActual} / {paginas}</span>
              <button
                type="button"
                disabled={paginaActual >= paginas}
                onClick={() => setPagina((v) => v + 1)}
              >
                Siguiente
              </button>
            </div>
          </footer>
        </section>
      )}

      {!idExamen && (
        <div className="hab-inicial">
          <FiClipboard />
          <p>
            Selecciona un examen para consultar las habilitaciones de sus estudiantes.
          </p>
        </div>
      )}

      {modal && (
        <ModalHabilitacion
          key={`${modal.estudiante.idEstudiante}-${modal.modo}`}
          estudiante={modal.estudiante}
          motivos={motivos}
          modo={modal.modo}
          guardando={guardando}
          onCerrar={() => setModal(null)}
          onGuardar={guardar}
        />
      )}
    </main>
  );
}
