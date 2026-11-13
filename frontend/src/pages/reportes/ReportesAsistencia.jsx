import { useEffect, useMemo, useState } from 'react'
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
import {
  descargarReporteHorarios,
  generarReporteHorarios,
  listarHistorialReportesHorarios,
  obtenerReporteHorarios
} from '../../services/reporteHorariosService'
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

function fechaHoraIngresoLegible(valor) {
  if (!valor) return '—'

  const fecha = new Date(valor)

  if (Number.isNaN(fecha.getTime())) return '—'

  return new Intl.DateTimeFormat('es-BO', {
    timeZone: 'America/La_Paz',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).format(fecha)
}

export default function ReportesAsistencia() {
  const [pestana, setPestana] = useState('generar')
  const [examenes, setExamenes] = useState([])
  const [busquedaExamen, setBusquedaExamen] = useState('')
  const [fechaExamen, setFechaExamen] = useState('')
  const [solicitudExamenes, setSolicitudExamenes] = useState({
    buscar: '',
    fecha: '',
    numero: 0
  })
  const [cargandoExamenes, setCargandoExamenes] = useState(true)
  const [generandoId, setGenerandoId] = useState(null)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [reporte, setReporte] = useState(null)
  const [filtroEstudiantes, setFiltroEstudiantes] = useState('')
  const [estadoEstudiantes, setEstadoEstudiantes] = useState('TODOS')
  const [busquedaHistorial, setBusquedaHistorial] = useState('')
  const [historial, setHistorial] = useState([])
  const [solicitudHistorial, setSolicitudHistorial] = useState({
    buscar: '',
    numero: 0
  })
  const [cargandoHistorial, setCargandoHistorial] = useState(false)
  const [descargando, setDescargando] = useState(false)
  const [tipoReporte, setTipoReporte] = useState('ASISTENCIA')
  const [tipoReporteVisualizado, setTipoReporteVisualizado] = useState('ASISTENCIA')
  const [tipoHistorial, setTipoHistorial] = useState('TODOS')
  const [abriendoReporte, setAbriendoReporte] = useState(false)

  useEffect(() => {
    let vigente = true

    async function cargar() {
      try {
        const data = await listarExamenesParaReporte({
          buscar: solicitudExamenes.buscar,
          fecha: solicitudExamenes.fecha
        })
        if (vigente) {
          setExamenes(Array.isArray(data) ? data : [])
          setError('')
        }
      } catch (err) {
        if (vigente) {
          setError(
            err.response?.data?.mensaje ||
              err.response?.data?.message ||
              'No se pudieron cargar los exámenes.'
          )
          setExamenes([])
        }
      } finally {
        if (vigente) setCargandoExamenes(false)
      }
    }

    void cargar()
    return () => {
      vigente = false
    }
  }, [solicitudExamenes])

  useEffect(() => {
    if (pestana !== 'historial') return undefined
    let vigente = true

    async function cargar() {
      try {
        const [reportesAsistencia, reportesHorarios] = await Promise.all([
          listarHistorialReportes(solicitudHistorial.buscar),
          listarHistorialReportesHorarios(solicitudHistorial.buscar)
        ])

        if (!vigente) return

        const asistencia = (Array.isArray(reportesAsistencia)
          ? reportesAsistencia
          : []
        ).map((item) => ({
          ...item,
          tipoReporte: 'ASISTENCIA'
        }))

        const horarios = (Array.isArray(reportesHorarios)
          ? reportesHorarios
          : []
        ).map((item) => ({
          ...item,
          tipoReporte: 'HORARIOS_INGRESO'
        }))

        const todos = [...asistencia, ...horarios].sort((a, b) => {
          const fechaA = new Date(a.fechaGeneracion).getTime()
          const fechaB = new Date(b.fechaGeneracion).getTime()

          return fechaB - fechaA || b.idReporte - a.idReporte
        })

        setHistorial(todos)
        setError('')
      } catch (err) {
        if (!vigente) return

        setError(
          err.response?.data?.mensaje ||
            err.response?.data?.message ||
            'No se pudo cargar el historial de reportes.'
        )

        setHistorial([])
      } finally {
        if (vigente) setCargandoHistorial(false)
      }
    }
    void cargar()
    return () => {
      vigente = false
    }
  }, [pestana, solicitudHistorial])

  const historialFiltrado = useMemo(() => {
    if (tipoHistorial === 'TODOS') return historial

    return historial.filter(
      (item) => item.tipoReporte === tipoHistorial
    )
  }, [historial, tipoHistorial])

  const solicitarExamenes = () => {
    setCargandoExamenes(true)
    setError('')
    setSolicitudExamenes((anterior) => ({
      buscar: busquedaExamen,
      fecha: fechaExamen,
      numero: anterior.numero + 1
    }))
  }

  const solicitarHistorial = () => {
    setCargandoHistorial(true)
    setError('')
    setPestana('historial')
    setSolicitudHistorial((anterior) => ({
      buscar: busquedaHistorial,
      numero: anterior.numero + 1
    }))
  }

  const generar = async (idExamen) => {
    if (generandoId !== null) return
    const tipoSeleccionado = tipoReporte
    setGenerandoId(idExamen)
    setError('')
    setMensaje('')
    setReporte(null)

    try {
      const data =
        tipoSeleccionado === 'ASISTENCIA'
          ? await generarReporteAsistencia(idExamen)
          : await generarReporteHorarios(idExamen)

      setTipoReporteVisualizado(tipoSeleccionado)
      setReporte(data)

      setMensaje(
        `La generación del reporte de “${data.nombreExamen}” quedó registrada en el historial.`
      )

      setFiltroEstudiantes('')
      setEstadoEstudiantes('TODOS')
      requestAnimationFrame(() => {
        document
          .getElementById('reporte-asistencia-vista-previa')
          ?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          })
      })
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

  const verReporte = async (item) => {
    if (abriendoReporte) return
    setAbriendoReporte(true)
    setError('')
    setMensaje('')
    setReporte(null)

    try {
      const data =
        item.tipoReporte === 'ASISTENCIA'
          ? await obtenerReporteAsistencia(item.idReporte)
          : await obtenerReporteHorarios(item.idReporte)

      setTipoReporteVisualizado(item.tipoReporte)
      setReporte(data)

      setFiltroEstudiantes('')
      setEstadoEstudiantes('TODOS')

      requestAnimationFrame(() => {
        document
          .getElementById('reporte-asistencia-vista-previa')
          ?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          })
      })
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          err.response?.data?.message ||
          'No se pudo abrir el reporte.'
      )
    } finally {
      setAbriendoReporte(false)
    }
  }
  
  const descargar = async () => {
    if (!reporte || descargando) return
    setDescargando(true)
    setError('')
    try {
      const esAsistencia =
        tipoReporteVisualizado === 'ASISTENCIA'

      const blob = esAsistencia
        ? await descargarReporteAsistencia(reporte.idReporte)
        : await descargarReporteHorarios(reporte.idReporte)

      const nombreArchivo = esAsistencia
        ? `reporte-asistencia-${reporte.idReporte}.csv`
        : `reporte-horarios-${reporte.idReporte}.csv`

      descargarBlob(blob, nombreArchivo)
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
          <p>Genera y consulta reportes de los exámenes</p>
        </div>
      </header>

      <nav className="ra-pestanas" aria-label="Secciones de reportes">
        <button
          className={pestana === 'generar' ? 'activa' : ''}
          onClick={() => setPestana('generar')}
        >
          <FiFileText /> Generar reporte
        </button>
        <button className={pestana === 'historial' ? 'activa' : ''} onClick={solicitarHistorial}>
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
              <p>Elige el tipo de reporte y el examen que deseas consultar</p>
            </div>
          </div>

          <div className="ra-tipo-reporte">
            <label htmlFor="tipo-reporte">Tipo de reporte</label>

            <select
              id="tipo-reporte"
              value={tipoReporte}
              onChange={(event) => setTipoReporte(event.target.value)}
              disabled={generandoId !== null}
            >
              <option value="ASISTENCIA">
                Reporte de asistencia
              </option>

              <option value="HORARIOS_INGRESO">
                Reporte de horarios de ingreso
              </option>
            </select>

            <p>
              {tipoReporte === 'ASISTENCIA'
                ? 'Consulta los estudiantes que asistieron y los ausentes.'
                : 'Consulta las fechas y horas de ingreso de los estudiantes.'}
            </p>
          </div>
          <form
            className="ra-filtros"
            onSubmit={(event) => {
              event.preventDefault()
              solicitarExamenes()
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
              <p>Consulta los reportes generados y vuelve a visualizar los registros actuales</p>
            </div>
          </div>
          <div className="ra-tipo-reporte">
            <label htmlFor="tipo-historial">
              Tipo de reporte
            </label>

            <select
              id="tipo-historial"
              value={tipoHistorial}
              onChange={(event) => setTipoHistorial(event.target.value)}
            >
              <option value="TODOS">
                Todos los reportes
              </option>

              <option value="ASISTENCIA">
                Reportes de asistencia
              </option>

              <option value="HORARIOS_INGRESO">
                Reportes de horarios de ingreso
              </option>
            </select>
          </div>
          <form
            className="ra-filtros ra-filtros-historial"
            onSubmit={(event) => {
              event.preventDefault()
              solicitarHistorial()
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
                  <th>Tipo de reporte</th>
                  <th>Fecha de generación</th>
                  <th>Generado por</th>
                  <th>Registros</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {historialFiltrado.map((item) => (
                  <tr key={`${item.tipoReporte}-${item.idReporte}`}>
                    <td>
                      RPT-{String(item.idReporte).padStart(3, '0')}
                    </td>

                    <td className="ra-texto-fuerte">
                      {item.nombreExamen}
                    </td>
                    <td>{item.asignatura}</td>

                    <td>
                      <span className="ra-etiqueta-tipo">
                        {item.tipoReporte === 'ASISTENCIA'
                          ? 'Asistencia'
                          : 'Horarios de ingreso'}
                      </span>
                    </td>

                    <td>{fechaHoraLegible(item.fechaGeneracion)}</td>

                    <td>{item.nombreGenerador}</td>

                    <td>
                      {item.tipoReporte === 'ASISTENCIA'
                        ? item.totalAsistentes
                        : item.totalIngresos}
                    </td>

                    <td>
                      <button
                        className="ra-boton-primario"
                        type="button"
                        onClick={() => verReporte(item)}
                        disabled={abriendoReporte}
                      >
                        <FiFileText />
                        {abriendoReporte ? 'Abriendo...' : 'Ver'}
                      </button>
                    </td>
                  </tr>
                ))}
                {!cargandoHistorial && historialFiltrado.length === 0 && (
                  <tr>
                    <td colSpan="8" className="ra-vacio">
                      {historial.length === 0
                        ? 'Todavía no hay reportes disponibles.'
                        : 'No hay reportes del tipo seleccionado.'}
                    </td>
                  </tr>
                )}
                {cargandoHistorial && (
                  <tr>
                    <td colSpan="8" className="ra-vacio">
                      Cargando historial...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="ra-conteo">
            Mostrando {historialFiltrado.length} de {historial.length} reportes
            {historial.length >= 1000 ? ' (consulta limitada)' : ''}
          </p>
        </section>
      )}

      {reporte && tipoReporteVisualizado === 'ASISTENCIA' && (
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

      {reporte && tipoReporteVisualizado === 'HORARIOS_INGRESO' && (
        <section
          className="ra-panel ra-reporte"
          id="reporte-asistencia-vista-previa"
        >     
          <div className="ra-reporte-encabezado">
            <div>
              <span className="ra-etiqueta">
                VISTA PREVIA · RPT-
                {String(reporte.idReporte).padStart(3, '0')}
              </span>

              <h2>Reporte de horarios de ingreso</h2>

              <p>
                Generado el {fechaHoraLegible(reporte.fechaGeneracion)}
                {' '}por {reporte.nombreGenerador}.
              </p>
            </div>
            <button
              type="button"
              className="ra-boton-primario"
              onClick={descargar}
              disabled={descargando}
            >
              <FiDownload />
              {descargando ? 'Descargando...' : 'Descargar CSV'}
            </button>
          </div>

          <div className="ra-resumen ra-resumen-horarios">
            <div>
              <span>Examen</span>
              <strong>{reporte.nombreExamen}</strong>
            </div>

            <div>
              <span>Asignatura</span>
              <strong>{reporte.asignatura}</strong>
            </div>

            <div>
              <span>Fecha del examen</span>
              <strong>{fechaLegible(reporte.fechaExamen)}</strong>
            </div>

            <div>
              <span>Hora de inicio</span>
              <strong>{horaLegible(reporte.horaInicio)}</strong>
            </div>

            <div className="ra-resumen-contador">
              <span>
                <FiClock /> Total ingresos
              </span>
              <strong>{reporte.totalIngresos}</strong>
            </div>
          </div>

          <div className="ra-lista-cabecera">
            <div>
              <h3>Horarios registrados</h3>
              <p>
                Estudiantes ordenados por fecha y hora de ingreso.
              </p>
            </div>
          </div>

          {reporte.estudiantes?.length === 0 ? (
            <div className="ra-vacio-grande">
              <FiClock />
              <h3>No hay ingresos registrados</h3>
              <p>
                Este examen todavía no tiene horarios de ingreso disponibles.
              </p>
            </div>
          ) : (
            <div className="ra-tabla-contenedor">
              <table className="ra-tabla">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Código SIS</th>
                    <th>Nombre completo</th>
                    <th>Fecha y hora de ingreso</th>
                  </tr>
                </thead>

                <tbody>
                  {(reporte.estudiantes || []).map(
                    (estudiante, indice) => (
                      <tr key={estudiante.idEstudiante}>
                        <td>{indice + 1}</td>

                        <td>
                          {estudiante.codigoEstudiante || '—'}
                        </td>

                        <td className="ra-texto-fuerte">
                          {estudiante.nombreCompleto}
                        </td>

                        <td>
                          {fechaHoraIngresoLegible(
                            estudiante.fechaHoraIngreso
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}

          <p className="ra-conteo">
            Total de ingresos registrados: {reporte.totalIngresos}
          </p>
        </section>
      )}
    </main>
  )
}
