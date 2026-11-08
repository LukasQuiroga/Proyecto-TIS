import { useEffect, useMemo, useState } from "react";
import { FiAlertCircle, FiCalendar, FiClipboard, FiEye, FiInfo, FiRefreshCw, FiSearch, FiUsers, FiX } from "react-icons/fi";
import { listarIntentosNoAutorizados, obtenerExamenesIngreso } from "../../services/validacionHabilitacionService";
import "./IntentosNoAutorizados.css";

function formatearFecha(valor) {
  if (!valor) return "—";
  return new Date(valor).toLocaleString("es-BO", { dateStyle: "short", timeStyle: "short" });
}

function fechaLocalISO(valor) {
  if (!valor) return "";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "";
  const zona = fecha.getTimezoneOffset() * 60000;
  return new Date(fecha.getTime() - zona).toISOString().slice(0, 10);
}

export default function IntentosNoAutorizados() {
  const [examenes, setExamenes] = useState([]);
  const [filas, setFilas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [codigoExamen, setCodigoExamen] = useState("");
  const [codigoAplicado, setCodigoAplicado] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [examenSeleccionado, setExamenSeleccionado] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [seleccionado, setSeleccionado] = useState(null);
  const [pagina, setPagina] = useState(1);
  const porPagina = 10;

  useEffect(() => {
    let vigente = true;
    obtenerExamenesIngreso()
      .then((data) => { if (vigente) setExamenes(Array.isArray(data) ? data : []); })
      .catch(() => { if (vigente) setError("No se pudieron cargar los exámenes."); });
    return () => { vigente = false; };
  }, []);

  const cargar = async (filtros = {}) => {
    setCargando(true);
    setError("");
    try {
      const data = await listarIntentosNoAutorizados(filtros);
      setFilas(Array.isArray(data) ? data : []);
      setPagina(1);
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo consultar el historial.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    let vigente = true;
    listarIntentosNoAutorizados()
      .then((data) => { if (vigente) setFilas(Array.isArray(data) ? data : []); })
      .catch(() => { if (vigente) setError("No se pudo consultar el historial."); })
      .finally(() => { if (vigente) setCargando(false); });

    return () => { vigente = false; };
  }, []);

  const codigosPorId = useMemo(
    () => new Map(examenes.map((item) => [String(item.idExamen), String(item.codigo || "").toLowerCase()])),
    [examenes],
  );

  const filasFiltradas = useMemo(() => {
    return filas.filter((fila) => {
      const codigoCoincide = !codigoAplicado || (codigosPorId.get(String(fila.idExamen)) || "").includes(codigoAplicado);
      const examenCoincide = !examenSeleccionado || String(fila.idExamen) === examenSeleccionado;
      const dia = fechaLocalISO(fila.fechaHora);
      return codigoCoincide && examenCoincide && (!fechaDesde || dia >= fechaDesde) && (!fechaHasta || dia <= fechaHasta);
    });
  }, [filas, codigosPorId, codigoAplicado, examenSeleccionado, fechaDesde, fechaHasta]);

  const resumenPorExamen = useMemo(() => {
    const grupos = new Map();
    for (const fila of filasFiltradas) {
      const llave = String(fila.idExamen ?? fila.nombreExamen ?? "sin-examen");
      const grupo = grupos.get(llave) || { llave, examen: fila.nombreExamen || `Examen ${fila.idExamen ?? "sin identificar"}`, filas: [] };
      grupo.filas.push(fila);
      grupos.set(llave, grupo);
    }
    return [...grupos.values()].map((grupo) => {
      const motivos = new Map();
      grupo.filas.forEach((fila) => {
        const motivo = fila.motivoRechazo || "Motivo no especificado";
        motivos.set(motivo, (motivos.get(motivo) || 0) + 1);
      });
      const motivoFrecuente = [...motivos.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
      const ultimo = grupo.filas.reduce((actual, fila) => !actual || new Date(fila.fechaHora) > new Date(actual.fechaHora) ? fila : actual, null);
      return { ...grupo, cantidad: grupo.filas.length, motivoFrecuente, ultimo: ultimo?.fechaHora };
    }).sort((a, b) => a.examen.localeCompare(b.examen, "es"));
  }, [filasFiltradas]);

  const estudiantesInvolucrados = new Set(filasFiltradas.map((fila) => fila.idEstudiante ?? fila.identificadorIntentado ?? fila.nombreEstudiante ?? fila.idIntento)).size;

  const total = Math.max(1, Math.ceil(filasFiltradas.length / porPagina));
  const visibles = filasFiltradas.slice((pagina - 1) * porPagina, pagina * porPagina);

  return (
    <main className="hu23-pagina">
      <div className="hu23-encabezado">
        <h1>Reporte de accesos incorrectos</h1>
        <p>Consulta de accesos rechazados durante el control de ingreso.</p>
      </div>
      <section className="hu23-tarjeta">
        <div className="hu23-resumen-tarjetas">
          <article className="hu23-resumen hu23-resumen-rojo"><span><FiAlertCircle /></span><div><small>Total de intentos rechazados</small><strong>{filasFiltradas.length}</strong></div></article>
          <article className="hu23-resumen hu23-resumen-azul"><span><FiUsers /></span><div><small>Estudiantes involucrados</small><strong>{estudiantesInvolucrados}</strong></div></article>
          <article className="hu23-resumen hu23-resumen-violeta"><span><FiClipboard /></span><div><small>Exámenes con incidencias</small><strong>{resumenPorExamen.length}</strong></div></article>
        </div>
        <form className="hu23-filtros" onSubmit={(event) => {
          event.preventDefault();
          setCodigoAplicado(codigoExamen.trim().toLowerCase());
          cargar({ q: busqueda });
        }}>
          <label className="hu23-busqueda"><FiSearch /><input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por estudiante o código..." /></label>
          <label className="hu23-busqueda">
            <FiSearch />
            <input
              type="search"
              value={codigoExamen}
              onChange={(e) => setCodigoExamen(e.target.value)}
              placeholder="Buscar por código de examen..."
              aria-label="Código de examen"
            />
          </label>
          <label className="hu23-filtro-fecha"><span>Fecha desde</span><span><FiCalendar /><input type="date" value={fechaDesde} max={fechaHasta || undefined} onChange={(e) => { setFechaDesde(e.target.value); setPagina(1); }} /></span></label>
          <label className="hu23-filtro-fecha"><span>Fecha hasta</span><span><FiCalendar /><input type="date" value={fechaHasta} min={fechaDesde || undefined} onChange={(e) => { setFechaHasta(e.target.value); setPagina(1); }} /></span></label>
          <label className="hu23-filtro-examen"><span>Examen</span><select value={examenSeleccionado} onChange={(e) => { setExamenSeleccionado(e.target.value); setPagina(1); }}><option value="">Todos los exámenes</option>{examenes.map((examen) => <option key={examen.idExamen} value={examen.idExamen}>{examen.nombreExamen || examen.codigo || `Examen ${examen.idExamen}`}</option>)}</select></label>
          <button type="submit" disabled={cargando}>Buscar</button>
          <button type="button" className="hu23-refrescar" title="Actualizar" onClick={() => { setCodigoAplicado(codigoExamen.trim().toLowerCase()); cargar({ q: busqueda }); }}><FiRefreshCw /></button>
        </form>
        <div className="hu23-aviso-reporte"><FiInfo /><span>Solo se incluyen accesos rechazados. Los ingresos autorizados no forman parte de este reporte.</span></div>
        {error && <p role="alert" className="hu23-error">{error}</p>}
        <section className="hu23-seccion-reporte">
          <h2>Resumen por examen</h2>
          <div className="hu23-scroll"><table className="hu23-tabla hu23-tabla-resumen"><thead><tr><th>Examen</th><th>Intentos rechazados</th><th>Motivo más frecuente</th><th>Último registro</th></tr></thead>
            <tbody>{resumenPorExamen.map((fila) => <tr key={fila.llave}><td>{fila.examen}</td><td>{fila.cantidad}</td><td>{fila.motivoFrecuente}</td><td>{formatearFecha(fila.ultimo)}</td></tr>)}{!cargando && resumenPorExamen.length === 0 && <tr><td colSpan={4} className="hu23-vacio">No hay accesos rechazados para los filtros seleccionados.</td></tr>}</tbody>
          </table></div>
        </section>
        <section className="hu23-seccion-detalle"><h2>Intentos de ingreso rechazados</h2>
        <div className="hu23-scroll"><table className="hu23-tabla"><thead><tr><th>Fecha y hora</th><th>Estudiante / Identificador</th><th>Método</th><th>Examen</th><th>Motivo del rechazo</th><th>Responsable</th><th>Acciones</th></tr></thead>
          <tbody>{visibles.map((fila) => <tr key={fila.idIntento}>
            <td>{formatearFecha(fila.fechaHora)}</td>
            <td><strong>{fila.nombreEstudiante || "No identificado"}</strong><small>{fila.identificadorIntentado || "—"}</small></td>
            <td>{fila.metodoIdentificacion}</td><td>{fila.nombreExamen}</td>
            <td><span className="hu23-motivo">{fila.motivoRechazo}</span></td><td>{fila.responsable}</td>
            <td><button className="hu23-ver" onClick={() => setSeleccionado(fila)} type="button"><FiEye /> Ver</button></td>
          </tr>)}{!cargando && visibles.length === 0 && <tr><td colSpan={7} className="hu23-vacio">No hay intentos registrados.</td></tr>}</tbody>
        </table></div>
        <div className="hu23-pie"><span>Mostrando {visibles.length} de {filasFiltradas.length} intentos</span><div><button type="button" disabled={pagina === 1} onClick={() => setPagina(p => p-1)}>Anterior</button> {pagina} / {total} <button type="button" disabled={pagina === total} onClick={() => setPagina(p => p+1)}>Siguiente</button></div></div>
        </section>
      </section>
      {seleccionado && <div className="hu23-fondo" role="presentation" onClick={() => setSeleccionado(null)}>
        <section className="hu23-modal" role="dialog" aria-modal="true" aria-label="Detalle del intento" onClick={(e) => e.stopPropagation()}>
          <div className="hu23-modal-cabecera"><h2>Detalle del intento #{seleccionado.idIntento}</h2><button aria-label="Cerrar" onClick={() => setSeleccionado(null)}><FiX /></button></div>
          <dl>{[
            ["Fecha y hora", formatearFecha(seleccionado.fechaHora)],
            ["Examen", seleccionado.nombreExamen],
            ["Estudiante", seleccionado.nombreEstudiante || "No identificado"],
            ["Identificador", seleccionado.identificadorIntentado || "—"],
            ["Método", seleccionado.metodoIdentificacion],
            ["Motivo de rechazo", seleccionado.motivoRechazo],
            ...(String(seleccionado.motivoRechazo || "").toLowerCase().includes("inhabilitado")
              ? [
                  ["Razón de inhabilitación", seleccionado.tituloMotivo || "No disponible"],
                  ["Descripción", seleccionado.descripcionMotivo || "No disponible"],
                ]
              : []),
            ["Responsable", seleccionado.responsable],
          ].map(([titulo, valor]) => <div key={titulo}><dt>{titulo}</dt><dd>{valor || "—"}</dd></div>)}</dl>
          <button className="hu23-cerrar" onClick={() => setSeleccionado(null)}>Cerrar</button>
        </section>
      </div>}
    </main>
  );
}
