import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiFileText,
  FiSearch,
  FiUsers,
  FiX
} from 'react-icons/fi'
import {
  descargarReporteAsistencia,
  generarReporteAsistencia,
  listarExamenesParaReporte,
  listarHistorialReportes,
  obtenerReporteAsistencia
} from '../../services/reporteAsistenciaService'
import './ReportesAsistencia.css'

function fechaLegible(fecha) {
  if (!fecha) return 'Sin fecha programada'
  const [anio, mes, dia] = fecha.slice(0, 10).split('-')
  return `${dia}/${mes}/${anio}`
}

function fechaHoraLegible(valor) {
  if (!valor) return '—'
  const fecha = new Date(valor)
  return Number.isNaN(fecha.getTime())
    ? '—'
    : fecha.toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })
}

function horaLegible(hora) {
  return hora ? hora.slice(0, 5) : '—'
}

function descargarBlob(blob, nombre) {
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  URL.revokeObjectURL(url)
}

export default function ReportesAsistencia() {
  const [pestana, setPestana] = useState('generar')
  const [examenes, setExamenes] = useState([])
  const [busquedaExamen, setBusquedaExamen] = useState('')
  const [fechaExamen, setFechaExamen] = useState('')
  const [cargandoExamenes, setCargandoExamenes] = useState(true)
  const [generandoId, setGenerandoId] = useState(null)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [reporte, setReporte] = useState(null)
  const [filtroEstudiantes, setFiltroEstudiantes] = useState('')
  const [estadoEstudiantes, setEstadoEstudiantes] = useState('TODOS')
  const [busquedaHistorial, setBusquedaHistorial] = useState('')
  const [historial, setHistorial] = useState([])
  const [cargandoHistorial, setCargandoHistorial] = useState(false)
  const [descargando, setDescargando] = useState(false)

  const cargarExamenes = useCallback(async () => {
    setCargandoExamenes(true)
    setError('')
    try {
      const data = await listarExamenesParaReporte({ buscar: busquedaExamen, fecha: fechaExamen })
      setExamenes(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          err.response?.data?.message ||
          'No se pudieron cargar los exámenes.'
      )
      setExamenes([])
    } finally {
      setCargandoExamenes(false)
    }
  }, [busquedaExamen, fechaExamen])

  useEffect(() => {
    cargarExamenes()
  }, [cargarExamenes])

  const cargarHistorial = useCallback(async () => {
    setCargandoHistorial(true)
    setError('')
    try {
      const data = await listarHistorialReportes(busquedaHistorial)
      setHistorial(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          err.response?.data?.message ||
          'No se pudo cargar el historial de reportes.'
      )
      setHistorial([])
    } finally {
      setCargandoHistorial(false)
    }
  }, [busquedaHistorial])

  useEffect(() => {
    if (pestana === 'historial') cargarHistorial()
  }, [pestana, cargarHistorial])

  const generar = async (idExamen) => {
    setGenerandoId(idExamen)
    setError('')
    setMensaje('')
    setReporte(null)
    try {
      const data = await generarReporteAsistencia(idExamen)
      setReporte(data)
      setMensaje(
        `La generación del reporte de “${data.nombreExamen}” quedó registrada en el historial.`
      )
      setFiltroEstudiantes('')
      setEstadoEstudiantes('TODOS')
      requestAnimationFrame(() =>
        document
          .getElementById('reporte-asistencia-vista-previa')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      )
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          err.response?.data?.message ||
          'No se pudo generar el reporte.'
      )
    } finally {
      setGenerandoId(null)
    }
  }

  const verReporte = async (idReporte) => {
    setError('')
    setMensaje('')
    try {
      const data = await obtenerReporteAsistencia(idReporte)
      setReporte(data)
      setFiltroEstudiantes('')
      setEstadoEstudiantes('TODOS')
      requestAnimationFrame(() =>
        document
          .getElementById('reporte-asistencia-vista-previa')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      )
    } catch (err) {
      setError(
        err.response?.data?.mensaje || err.response?.data?.message || 'No se pudo abrir el reporte.'
      )
    }
  }

  const descargar = async () => {
    if (!reporte) return
    setDescargando(true)
    setError('')
    try {
      const blob = await descargarReporteAsistencia(reporte.idReporte)
      descargarBlob(blob, `reporte-asistencia-${reporte.idReporte}.csv`)
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          err.response?.data?.message ||
          'No se pudo descargar el reporte.'
      )
    } finally {
      setDescargando(false)
    }
  }

  const estudiantesVisibles = useMemo(() => {
    if (!reporte) return []
    const busqueda = filtroEstudiantes.trim().toLocaleLowerCase('es')
    return (reporte.estudiantes || []).filter((estudiante) => {
      const coincideEstado =
        estadoEstudiantes === 'TODOS' || estudiante.estadoAsistencia === estadoEstudiantes
      const coincideTexto =
        !busqueda ||
        `${estudiante.nombreCompleto} ${estudiante.codigoEstudiante || ''}`
          .toLocaleLowerCase('es')
          .includes(busqueda)
      return coincideEstado && coincideTexto
    })
  }, [reporte, filtroEstudiantes, estadoEstudiantes])

  return (
    <main className="reportes-asistencia">
      <header className="ra-encabezado">
        <div>
          <span className="ra-etiqueta">SEGUIMIENTO Y CONTROL</span>
          <h1>Reportes</h1>
          <p>Genera y consulta reportes de asistencia de los exámenes.</p>
        </div>
      </header>

      <nav className="ra-pestanas" aria-label="Secciones de reportes">
        <button
          className={pestana === 'generar' ? 'activa' : ''}
          onClick={() => setPestana('generar')}
        >
          <FiFileText /> Generar reporte
        </button>
        <button
          className={pestana === 'historial' ? 'activa' : ''}
          onClick={() => setPestana('historial')}
        >
          <FiClock /> Historial de reportes
        </button>
      </nav>

      {error && (
        <div className="ra-aviso ra-error" role="alert">
          <FiAlertCircle />
          {error}
          <button onClick={() => setError('')} aria-label="Cerrar aviso">
            <FiX />
          </button>
        </div>
      )}
      {mensaje && (
        <div className="ra-aviso ra-exito" role="status">
          <FiCheckCircle />
          {mensaje}
          <button onClick={() => setMensaje('')} aria-label="Cerrar aviso">
            <FiX />
          </button>
        </div>
      )}

      {pestana === 'generar' ? (
        <section className="ra-panel">
          <div className="ra-panel-cabecera">
            <div>
              <h2>Seleccionar examen</h2>
              <p>Elige un examen para generar su reporte de asistencia.</p>
            </div>
          </div>
          <form
            className="ra-filtros"
            onSubmit={(event) => {
              event.preventDefault()
              cargarExamenes()
            }}
          >
            <label className="ra-busqueda">
              <FiSearch />
              <input
                value={busquedaExamen}
                onChange={(event) => setBusquedaExamen(event.target.value)}
                placeholder="Buscar por examen, asignatura o código..."
              />
            </label>
            <label className="ra-fecha">
              <span>Filtrar por fecha</span>
              <span className="ra-campo-fecha">
                <FiCalendar />
                <input
                  type="date"
                  value={fechaExamen}
                  onChange={(event) => setFechaExamen(event.target.value)}
                />
              </span>
            </label>
            <button className="ra-boton-secundario" type="submit">
              Buscar
            </button>
          </form>
          <div className="ra-tabla-contenedor">
            <table className="ra-tabla">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre del examen</th>
                  <th>Asignatura</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {examenes.map((examen) => (
                  <tr key={examen.idExamen}>
                    <td>{examen.codigoExamen || examen.idExamen}</td>
                    <td className="ra-texto-fuerte">{examen.nombreExamen}</td>
                    <td>{examen.asignatura}</td>
                    <td>{fechaLegible(examen.fechaExamen)}</td>
                    <td>{horaLegible(examen.horaInicio)}</td>
                    <td>
                      <button
                        className="ra-boton-primario"
                        onClick={() => generar(examen.idExamen)}
                        disabled={generandoId !== null}
                      >
                        <FiFileText />
                        {generandoId === examen.idExamen ? 'Generando...' : 'Generar reporte'}
                      </button>
                    </td>
                  </tr>
                ))}
                {!cargandoExamenes && examenes.length === 0 && (
                  <tr>
                    <td colSpan="6" className="ra-vacio">
                      No se encontraron exámenes para los filtros seleccionados.
                    </td>
                  </tr>
                )}
                {cargandoExamenes && (
                  <tr>
                    <td colSpan="6" className="ra-vacio">
                      Cargando exámenes...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="ra-conteo">
            Mostrando {examenes.length} de {examenes.length} exámenes
          </p>
        </section>
      ) : (
        <section className="ra-panel">
          <div className="ra-panel-cabecera">
            <div>
              <h2>Historial de reportes</h2>
              <p>Consulta cuándo se generaron y vuelve a consultar la asistencia actual.</p>
            </div>
          </div>
          <form
            className="ra-filtros ra-filtros-historial"
            onSubmit={(event) => {
              event.preventDefault()
              cargarHistorial()
            }}
          >
            <label className="ra-busqueda">
              <FiSearch />
              <input
                value={busquedaHistorial}
                onChange={(event) => setBusquedaHistorial(event.target.value)}
                placeholder="Buscar por examen, asignatura o administrador..."
              />
            </label>
            <button className="ra-boton-secundario" type="submit">
              Buscar
            </button>
          </form>
          <div className="ra-tabla-contenedor">
            <table className="ra-tabla">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Examen</th>
                  <th>Asignatura</th>
                  <th>Fecha de generación</th>
                  <th>Generado por</th>
                  <th>Asistentes</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((item) => (
                  <tr key={item.idReporte}>
                    <td>RPT-{String(item.idReporte).padStart(3, '0')}</td>
                    <td className="ra-texto-fuerte">{item.nombreExamen}</td>
                    <td>{item.asignatura}</td>
                    <td>{fechaHoraLegible(item.fechaGeneracion)}</td>
                    <td>{item.nombreGenerador}</td>
                    <td>{item.totalAsistentes}</td>
                    <td>
                      <button
                        className="ra-boton-primario"
                        onClick={() => verReporte(item.idReporte)}
                      >
                        <FiFileText />
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
                {!cargandoHistorial && historial.length === 0 && (
                  <tr>
                    <td colSpan="7" className="ra-vacio">
                      Todavía no hay reportes generados.
                    </td>
                  </tr>
                )}
                {cargandoHistorial && (
                  <tr>
                    <td colSpan="7" className="ra-vacio">
                      Cargando historial...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="ra-conteo">
            Mostrando {historial.length} reportes{' '}
            {historial.length === 500 ? '(límite de consulta)' : ''}
          </p>
        </section>
      )}

      {reporte && (
        <section className="ra-panel ra-reporte" id="reporte-asistencia-vista-previa">
          <div className="ra-reporte-encabezado">
            <div>
              <span className="ra-etiqueta">
                VISTA PREVIA · RPT-{String(reporte.idReporte).padStart(3, '0')}
              </span>
              <h2>Reporte de asistencia</h2>
              <p>
                Generado el {fechaHoraLegible(reporte.fechaGeneracion)} por{' '}
                {reporte.nombreGenerador}. La asistencia refleja los registros actuales del examen.
              </p>
            </div>
            <button className="ra-boton-primario" onClick={descargar} disabled={descargando}>
              <FiDownload />
              {descargando ? 'Descargando...' : 'Descargar CSV'}
            </button>
          </div>
          <div className="ra-resumen">
            <div>
              <span>Examen</span>
              <strong>{reporte.nombreExamen}</strong>
            </div>
            <div>
              <span>Asignatura</span>
              <strong>{reporte.asignatura}</strong>
            </div>
            <div>
              <span>Fecha</span>
              <strong>{fechaLegible(reporte.fechaExamen)}</strong>
            </div>
            <div>
              <span>Hora</span>
              <strong>{horaLegible(reporte.horaInicio)}</strong>
            </div>
            <div className="ra-resumen-contador">
              <span>
                <FiCheckCircle /> Total asistentes
              </span>
              <strong>{reporte.totalAsistentes}</strong>
            </div>
            <div className="ra-resumen-contador ra-total-ausentes">
              <span>
                <FiX /> Total ausentes
              </span>
              <strong>{reporte.totalAusentes}</strong>
            </div>
            <div className="ra-resumen-contador ra-total-padron">
              <span>
                <FiUsers /> Total en padrón
              </span>
              <strong>{reporte.totalPadron}</strong>
            </div>
          </div>
          <div className="ra-lista-cabecera">
            <div>
              <h3>Estudiantes del examen</h3>
              <p>
                Los registros de asistencia del examen se consultan directamente desde el sistema.
              </p>
            </div>
            <div className="ra-lista-filtros">
              <label className="ra-busqueda">
                <FiSearch />
                <input
                  value={filtroEstudiantes}
                  onChange={(event) => setFiltroEstudiantes(event.target.value)}
                  placeholder="Buscar por nombre o código..."
                />
              </label>
              <select
                value={estadoEstudiantes}
                onChange={(event) => setEstadoEstudiantes(event.target.value)}
                aria-label="Filtrar por asistencia"
              >
                <option value="TODOS">Todos</option>
                <option value="ASISTIO">Asistieron</option>
                <option value="AUSENTE">Ausentes</option>
              </select>
            </div>
          </div>
          {reporte.totalAsistentes === 0 && (
            <div className="ra-sin-asistencias">
              <FiAlertCircle />
              <div>
                <strong>No hay asistencias registradas</strong>
                <span>
                  Este reporte no encontró ingresos autorizados. Los estudiantes del padrón aparecen
                  identificados como ausentes.
                </span>
              </div>
            </div>
          )}
          {reporte.totalPadron === 0 ? (
            <div className="ra-vacio-grande">
              <FiFileText />
              <h3>No hay estudiantes en el padrón</h3>
              <p>No se encontraron estudiantes inscritos para este examen.</p>
            </div>
          ) : (
            <div className="ra-tabla-contenedor">
              <table className="ra-tabla">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Código</th>
                    <th>Nombre completo</th>
                    <th>Asistencia</th>
                    <th>Hora de ingreso</th>
                  </tr>
                </thead>
                <tbody>
                  {estudiantesVisibles.map((estudiante, indice) => (
                    <tr key={estudiante.idEstudiante}>
                      <td>{indice + 1}</td>
                      <td>{estudiante.codigoEstudiante || '—'}</td>
                      <td className="ra-texto-fuerte">{estudiante.nombreCompleto}</td>
                      <td>
                        <span
                          className={`ra-estado ${estudiante.estadoAsistencia === 'ASISTIO' ? 'ra-estado-asistio' : 'ra-estado-ausente'}`}
                        >
                          {estudiante.estadoAsistencia === 'ASISTIO' ? 'Asistió' : 'Ausente'}
                        </span>
                      </td>
                      <td>{fechaHoraLegible(estudiante.fechaHoraIngreso)}</td>
                    </tr>
                  ))}
                  {estudiantesVisibles.length === 0 && (
                    <tr>
                      <td colSpan="5" className="ra-vacio">
                        No hay estudiantes para los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          <p className="ra-conteo">
            Mostrando {estudiantesVisibles.length} de {reporte.totalPadron} estudiantes ·{' '}
            {reporte.totalAusentes} ausentes
          </p>
        </section>
      )}
    </main>
  )
}
