import { useEffect, useMemo, useState } from "react";
import { FiEye, FiRefreshCw, FiSearch, FiX } from "react-icons/fi";
import { listarIntentosNoAutorizados, obtenerExamenesIngreso } from "../../services/validacionHabilitacionService";
import "./IntentosNoAutorizados.css";

function formatearFecha(valor) {
  if (!valor) return "—";
  return new Date(valor).toLocaleString("es-BO", { dateStyle: "short", timeStyle: "short" });
}

export default function IntentosNoAutorizados() {
  const [examenes, setExamenes] = useState([]);
  const [filas, setFilas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [codigoExamen, setCodigoExamen] = useState("");
  const [codigoAplicado, setCodigoAplicado] = useState("");
  const [cargando, setCargando] = useState(false);
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
      .catch(() => { if (vigente) setError("No se pudo consultar el historial."); });
    return () => { vigente = false; };
  }, []);

  const codigosPorId = useMemo(
    () => new Map(examenes.map((item) => [String(item.idExamen), String(item.codigo || "").toLowerCase()])),
    [examenes],
  );

  const filasFiltradas = useMemo(() => {
    if (!codigoAplicado) return filas;
    return filas.filter((fila) =>
      (codigosPorId.get(String(fila.idExamen)) || "").includes(codigoAplicado),
    );
  }, [filas, codigosPorId, codigoAplicado]);

  const total = Math.max(1, Math.ceil(filasFiltradas.length / porPagina));
  const visibles = filasFiltradas.slice((pagina - 1) * porPagina, pagina * porPagina);

  return (
    <main className="hu23-pagina">
      <div className="hu23-encabezado">
        <h1>Intentos de ingreso no autorizado</h1>
        <p>Consulta de accesos rechazados durante el control de ingreso.</p>
      </div>
      <section className="hu23-tarjeta">
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
          <button type="submit" disabled={cargando}>Buscar</button>
          <button type="button" className="hu23-refrescar" title="Actualizar" onClick={() => { setCodigoAplicado(codigoExamen.trim().toLowerCase()); cargar({ q: busqueda }); }}><FiRefreshCw /></button>
        </form>
        {error && <p role="alert" className="hu23-error">{error}</p>}
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
      {seleccionado && <div className="hu23-fondo" role="presentation" onClick={() => setSeleccionado(null)}>
        <section className="hu23-modal" role="dialog" aria-modal="true" aria-label="Detalle del intento" onClick={(e) => e.stopPropagation()}>
          <div className="hu23-modal-cabecera"><h2>Detalle del intento #{seleccionado.idIntento}</h2><button aria-label="Cerrar" onClick={() => setSeleccionado(null)}><FiX /></button></div>
          <dl>{[["Fecha y hora", formatearFecha(seleccionado.fechaHora)], ["Examen", seleccionado.nombreExamen], ["Estudiante", seleccionado.nombreEstudiante || "No identificado"], ["Identificador", seleccionado.identificadorIntentado || "—"], ["Método", seleccionado.metodoIdentificacion], ["Motivo de rechazo", seleccionado.motivoRechazo], ["Responsable", seleccionado.responsable]].map(([titulo, valor]) => <div key={titulo}><dt>{titulo}</dt><dd>{valor}</dd></div>)}</dl>
          <button className="hu23-cerrar" onClick={() => setSeleccionado(null)}>Cerrar</button>
        </section>
      </div>}
    </main>
  );
}
