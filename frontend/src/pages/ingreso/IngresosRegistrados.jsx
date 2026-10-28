import { useEffect, useMemo, useState } from "react";
import { FiCalendar, FiEdit, FiEye, FiFileText, FiFilter, FiSearch, FiX } from "react-icons/fi";
import {
  actualizarIngresoRegistrado,
  obtenerExamenesIngreso,
  obtenerIngresoRegistrado,
} from "../../services/validacionHabilitacionService";
import { listarIngresosRegistrados } from "../../services/validacionHabilitacionService";
import "./IngresosRegistrados.css";

function IngresosRegistrados() {
  const [examenes, setExamenes] = useState([]);
  const [ingresos, setIngresos] = useState([]);
  const [q, setQ] = useState("");
  const [idExamen, setIdExamen] = useState("");
  const [fecha, setFecha] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [pagina, setPagina] = useState(1);
  const porPagina = 5;
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalModo, setModalModo] = useState("editar");
  const [ingresoSeleccionado, setIngresoSeleccionado] = useState(null);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState("SUSPENDIDO");
  const [motivo, setMotivo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState("");

  useEffect(() => {
    let activo = true;
    obtenerExamenesIngreso()
      .then((datos) => {
        if (activo) setExamenes(datos || []);
      })
      .catch(() => {
        if (activo) setError("No se pudieron cargar los exámenes.");
      });
    return () => {
      activo = false;
    };
  }, []);

  const cargar = async () => {
    setCargando(true);
    setError("");
    try {
      const datos = await listarIngresosRegistrados({ q, idExamen, fecha });
      setIngresos(Array.isArray(datos) ? datos : []);
      setPagina(1);
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          err.response?.data?.message ||
          "No se pudieron cargar los ingresos registrados."
      );
      setIngresos([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    let activo = true;

    const ejecutarCarga = async () => {
      if (!activo) return;
      setCargando(true);
      setError("");
      try {
        const datos = await listarIngresosRegistrados({});
        if (activo) {
          setIngresos(Array.isArray(datos) ? datos : []);
          setPagina(1);
        }
      } catch (err) {
        if (activo) {
          setError(
            err.response?.data?.mensaje ||
              err.response?.data?.message ||
              "No se pudieron cargar los ingresos registrados."
          );
          setIngresos([]);
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    };

    ejecutarCarga();

    return () => {
      activo = false;
    };
  }, []);

  const formatearId = (id) => {
    if (!id) return "-";
    return `IG-${String(id).padStart(3, "0")}`;
  };

  const formatearFecha = (valor) => {
    if (!valor) return "-";
    try {
      const fechaObj = new Date(valor);
      const dia = String(fechaObj.getDate()).padStart(2, "0");
      const mes = String(fechaObj.getMonth() + 1).padStart(2, "0");
      const anio = fechaObj.getFullYear();
      return `${dia}/${mes}/${anio}`;
    } catch {
      return "-";
    }
  };

  const formatearHora = (valor) => {
    if (!valor) return "-";
    try {
      const fechaObj = new Date(valor);
      const horas = String(fechaObj.getHours()).padStart(2, "0");
      const minutos = String(fechaObj.getMinutes()).padStart(2, "0");
      const segundos = String(fechaObj.getSeconds()).padStart(2, "0");
      return `${horas}:${minutos}:${segundos}`;
    } catch {
      return "-";
    }
  };

  const total = ingresos.length;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * porPagina;
  const datosPagina = ingresos.slice(inicio, inicio + porPagina);

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
    setPagina(nuevaPagina);
  };

  const paginas = useMemo(() => {
    const arr = [];
    for (let i = 1; i <= totalPaginas; i++) {
      arr.push(i);
    }
    return arr;
  }, [totalPaginas]);

  const abrirEditar = async (ingreso) => {
    try {
      const detalle = await obtenerIngresoRegistrado(ingreso.idIngreso);
      setIngresoSeleccionado(detalle);
      setModalModo("editar");
      setEstadoSeleccionado(detalle.estado === "SUSPENDIDO" ? "REINCORPORADO" : "SUSPENDIDO");
      setMotivo("");
      setErrorModal("");
      setModalAbierto(true);
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          err.response?.data?.message ||
          "No se pudo cargar el ingreso seleccionado.",
      );
    }
  };

  const abrirVer = async (ingreso) => {
    try {
      const detalle = await obtenerIngresoRegistrado(ingreso.idIngreso);
      setIngresoSeleccionado(detalle);
      setModalModo("ver");
      setErrorModal("");
      setModalAbierto(true);
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          err.response?.data?.message ||
          "No se pudo cargar el ingreso seleccionado.",
      );
    }
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setIngresoSeleccionado(null);
    setMotivo("");
    setErrorModal("");
  };

  const guardarEdicion = async () => {
    if (!ingresoSeleccionado) return;
    if (motivo.trim().length === 0) {
      setErrorModal("Debe ingresar el motivo.");
      return;
    }
    if (motivo.trim().length > 200) {
      setErrorModal("El motivo no debe exceder 200 caracteres.");
      return;
    }

    setGuardando(true);
    setErrorModal("");
    try {
      await actualizarIngresoRegistrado(ingresoSeleccionado.idIngreso, {
        estado: estadoSeleccionado,
        motivo: motivo.trim(),
      });
      await cargar();
      cerrarModal();
    } catch (err) {
      setErrorModal(
        err.response?.data?.mensaje ||
          err.response?.data?.message ||
          "No se pudo actualizar el ingreso.",
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <main className="ingresos-registrados-pagina">
      <header className="ingresos-registrados-encabezado">
        <h1>Ingresos registrados</h1>
        <p>Consulte la fecha y hora de los ingresos autorizados de los estudiantes.</p>
      </header>

      <section className="ingresos-registrados-contenedor">
        <div className="ingresos-registrados-filtros">
          <div className="ingresos-registrados-buscador">
            <FiSearch className="ingresos-registrados-buscador-icono" />
            <input
              type="text"
              placeholder="Buscar estudiante por código o nombre..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="ingresos-registrados-campo">
            <label>Examen</label>
            <select value={idExamen} onChange={(e) => setIdExamen(e.target.value)} style={{ direction: "ltr" }}>
              <option value="">Todos</option>
              {examenes.map((examen) => (
                <option key={examen.idExamen} value={examen.idExamen} style={{ direction: "ltr" }}>
                  {examen.codigo && examen.nombreExamen
                    ? `${examen.codigo} - ${examen.nombreExamen}`
                    : examen.nombreExamen || examen.codigo}
                </option>
              ))}
            </select>
          </div>

          <div className="ingresos-registrados-campo">
            <label>Fecha</label>
            <div className="ingresos-registrados-fecha-wrapper">
              <FiCalendar className="ingresos-registrados-fecha-icono" />
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                placeholder="Seleccionar fecha"
              />
            </div>
          </div>

          <button type="button" className="ingresos-registrados-boton-filtrar" onClick={cargar}>
            <FiFilter />
            <span>Filtrar</span>
          </button>
        </div>

        <div className="ingresos-registrados-mensaje">
          <div className="ingresos-registrados-mensaje-icono">
            <FiFileText />
          </div>
          <span>
            {cargando
              ? "Cargando ingresos registrados..."
              : error
                ? error
                : `Se encontraron ${total} ingreso${total === 1 ? "" : "s"} registrado${total === 1 ? "" : "s"}.`}
          </span>
        </div>

        <div className="ingresos-registrados-tabla-contenedor">
          <table className="ingresos-registrados-tabla">
            <thead>
              <tr>
                <th>ID</th>
                <th>Código</th>
                <th>Estudiante</th>
                <th>Examen</th>
                <th>Ambiente</th>
                <th>Fecha de ingreso</th>
                <th>Hora de ingreso</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {datosPagina.map((ingreso, index) => (
                <tr key={ingreso.idIngreso || index}>
                  <td>{formatearId(ingreso.idIngreso)}</td>
                  <td>{ingreso.codigoUniversitario || "-"}</td>
                  <td className="ingresos-registrados-estudiante">{ingreso.nombreEstudiante || "-"}</td>
                  <td>{ingreso.nombreExamen || "-"}</td>
                  <td>{ingreso.ambiente || "-"}</td>
                  <td>{formatearFecha(ingreso.fechaHoraIngreso)}</td>
                  <td>{formatearHora(ingreso.fechaHoraIngreso)}</td>
                  <td>
                    <span className={`ingresos-registrados-estado ${ingreso.estado === "SUSPENDIDO" ? "ingresos-registrados-estado-suspendido" : ""}`}>{ingreso.estado || "REGISTRADO"}</span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <button type="button" className="ingresos-registrados-boton-ver" title="Ver" onClick={() => abrirVer(ingreso)}>
                        <FiEye />
                      </button>
                      <button type="button" className="ingresos-registrados-boton-ver" title="Editar" onClick={() => abrirEditar(ingreso)}>
                        <FiEdit />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!cargando && datosPagina.length === 0 && (
                <tr>
                  <td colSpan="9" className="ingresos-registrados-sin-resultados">
                    No hay ingresos registrados para los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="ingresos-registrados-paginacion">
          <div className="ingresos-registrados-paginacion-info">
            Mostrando {datosPagina.length === 0 ? 0 : inicio + 1} - {Math.min(inicio + porPagina, total)} de {total} ingresos registrados
          </div>
          <div className="ingresos-registrados-paginacion-controles">
            <button
              type="button"
              className="ingresos-registrados-paginacion-boton"
              onClick={() => cambiarPagina(paginaActual - 1)}
              disabled={paginaActual === 1}
            >
              ‹
            </button>
            {paginas.map((num) => (
              <button
                key={num}
                type="button"
                className={`ingresos-registrados-paginacion-boton ${num === paginaActual ? "activa" : ""}`}
                onClick={() => cambiarPagina(num)}
              >
                {num}
              </button>
            ))}
                <button
                  type="button"
                  className="ingresos-registrados-paginacion-boton"
                  onClick={() => cambiarPagina(paginaActual + 1)}
                  disabled={paginaActual === totalPaginas}
                >
                  ›
                </button>
              </div>
            </div>
          </section>

          {modalAbierto && (
            <div className="ingresos-registrados-modal-overlay">
              <div className="ingresos-registrados-modal">
                <div className="ingresos-registrados-modal-header">
                  <h2>{modalModo === "ver" ? "Detalle de ingreso" : "Actualizar ingreso"}</h2>
                  <button type="button" onClick={cerrarModal} className="ingresos-registrados-modal-close">
                    <FiX />
                  </button>
                </div>
                <div className="ingresos-registrados-modal-body">
                  {ingresoSeleccionado && (
                    <>
                      <div className="ingresos-registrados-modal-grid">
                        <div>
                          <label>ID</label>
                          <p>{formatearId(ingresoSeleccionado.idIngreso)}</p>
                        </div>
                        <div>
                          <label>Código</label>
                          <p>{ingresoSeleccionado.codigoUniversitario || "-"}</p>
                        </div>
                        <div>
                          <label>Estudiante</label>
                          <p>{ingresoSeleccionado.nombreEstudiante || "-"}</p>
                        </div>
                        <div>
                          <label>Examen</label>
                          <p>{ingresoSeleccionado.nombreExamen || "-"}</p>
                        </div>
                        <div>
                          <label>Ambiente</label>
                          <p>{ingresoSeleccionado.ambiente || "-"}</p>
                        </div>
                        <div>
                          <label>Fecha de ingreso</label>
                          <p>{formatearFecha(ingresoSeleccionado.fechaHoraIngreso)}</p>
                        </div>
                        <div>
                          <label>Hora de ingreso</label>
                          <p>{formatearHora(ingresoSeleccionado.fechaHoraIngreso)}</p>
                        </div>
                        <div>
                          <label>Fecha/Hora de salida</label>
                          <p>{ingresoSeleccionado.fechaHoraSalida ? `${formatearFecha(ingresoSeleccionado.fechaHoraSalida)} ${formatearHora(ingresoSeleccionado.fechaHoraSalida)}` : "-"}</p>
                        </div>
                        <div>
                          <label>Estado</label>
                          <p>{ingresoSeleccionado.estado || "REGISTRADO"}</p>
                        </div>
                        <div>
                          <label>Motivo de suspensión</label>
                          <p>{ingresoSeleccionado.motivoSuspension || "-"}</p>
                        </div>
                        <div>
                          <label>Motivo de reincorporación</label>
                          <p>{ingresoSeleccionado.motivoReincorporacion || "-"}</p>
                        </div>
                      </div>

                      {modalModo === "editar" && (
                        <div className="ingresos-registrados-modal-form">
                          <div className="ingresos-registrados-campo">
                            <label>Acción</label>
                            <select value={estadoSeleccionado} onChange={(e) => setEstadoSeleccionado(e.target.value)}>
                              {ingresoSeleccionado.estado === "SUSPENDIDO" ? (
                                <option value="REINCORPORADO">Reincorporado</option>
                              ) : (
                                <option value="SUSPENDIDO">Suspendido</option>
                              )}
                            </select>
                          </div>
                          <div className="ingresos-registrados-campo" style={{ flex: 1 }}>
                            <label>
                              {estadoSeleccionado === "SUSPENDIDO" ? "Motivo de suspensión (máx. 200)" : "Motivo de reincorporación (máx. 200)"}
                            </label>
                            <textarea
                              value={motivo}
                              onChange={(e) => setMotivo(e.target.value)}
                              maxLength={200}
                              rows={3}
                              placeholder="Ingrese el motivo..."
                            />
                            <small>{motivo.length}/200</small>
                          </div>
                          {errorModal && <div className="ingresos-registrados-modal-error">{errorModal}</div>}
                          <div className="ingresos-registrados-modal-actions">
                            <button type="button" className="ingresos-registrados-boton-ver" style={{ width: "auto", padding: "0 16px" }} onClick={cerrarModal}>
                              Cancelar
                            </button>
                            <button type="button" className="ingresos-registrados-boton-filtrar" style={{ marginLeft: 0 }} onClick={guardarEdicion} disabled={guardando}>
                              {guardando ? "Guardando..." : "Guardar"}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      );
    }

    export default IngresosRegistrados;
