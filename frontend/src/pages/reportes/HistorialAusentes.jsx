import { useEffect, useState } from 'react'
import { FiAlertCircle, FiArrowLeft, FiFileText, FiSearch } from 'react-icons/fi'
import {
  listarHistorialAusentes,
  obtenerReporteAusentes
} from '../../services/reporteAsistenciaService'
import './HistorialAusentes.css'

function fechaLegible(fecha) {
  if (!fecha) return '—'
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

export default function HistorialAusentes() {
  const [historial, setHistorial] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [solicitud, setSolicitud] = useState({ buscar: '', numero: 0 })
  const [cargando, setCargando] = useState(true)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [reporte, setReporte] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let vigente = true
    async function cargar() {
      try {
        const data = await listarHistorialAusentes(solicitud.buscar)
        if (vigente) {
          setHistorial(Array.isArray(data) ? data : [])
          setError('')
        }
      } catch (err) {
        if (vigente) {
          setError(
            err.response?.data?.mensaje ||
              err.response?.data?.message ||
              'No se pudo cargar el historial de ausentes.'
          )
          setHistorial([])
        }
      } finally {
        if (vigente) setCargando(false)
      }
    }
    void cargar()
    return () => {
      vigente = false
    }
  }, [solicitud])

  const buscar = (event) => {
    event.preventDefault()
    setError('')
    setCargando(true)
    setSolicitud((actual) => ({ buscar: busqueda, numero: actual.numero + 1 }))
  }

  const ver = async (idReporte) => {
    setCargandoDetalle(true)
    setError('')
    try {
      setReporte(await obtenerReporteAusentes(idReporte))
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          err.response?.data?.message ||
          'No se pudo abrir el reporte guardado.'
      )
    } finally {
      setCargandoDetalle(false)
    }
  }

  if (reporte) {
    return (
      <section className="ra-panel rah-panel">
        <button className="ra-ausentes-volver" onClick={() => setReporte(null)}>
          <FiArrowLeft /> Volver al historial
        </button>
        <div className="ra-panel-cabecera rah-detalle-cabecera">
          <div>
            <span className="ra-etiqueta">REPORTE GUARDADO</span>
            <h2>Reporte de ausentes</h2>
            <p>{reporte.nombreExamen}</p>
          </div>
        </div>
        <div className="ra-resumen ra-resumen-ausentes">
          <div><span>Asignatura</span><strong>{reporte.asignatura}</strong></div>
          <div><span>Fecha del examen</span><strong>{fechaLegible(reporte.fechaExamen)}</strong></div>
          <div className="ra-resumen-contador ra-total-ausentes">
            <span>Total de ausentes</span><strong>{reporte.totalAusentes}</strong>
          </div>
          <div className="ra-resumen-contador">
            <span>Total de asistentes</span><strong>{reporte.totalAsistentes}</strong>
          </div>
          <div className="ra-resumen-contador ra-total-padron">
            <span>Total en padrón</span><strong>{reporte.totalPadron}</strong>
          </div>
        </div>
        {reporte.estudiantesAusentes?.length ? (
          <div className="ra-tabla-contenedor">
            <table className="ra-tabla">
              <thead><tr><th>#</th><th>Código</th><th>Nombre completo</th><th>Estado</th></tr></thead>
              <tbody>
                {reporte.estudiantesAusentes.map((estudiante, indice) => (
                  <tr key={estudiante.idEstudiante}>
                    <td>{indice + 1}</td>
                    <td>{estudiante.codigoEstudiante || '—'}</td>
                    <td className="ra-texto-fuerte">{estudiante.nombreCompleto}</td>
                    <td><span className="ra-estado ra-estado-ausente">Ausente</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="ra-vacio-grande"><h3>No hubo estudiantes ausentes</h3></div>
        )}
      </section>
    )
  }

  return (
    <section className="ra-panel rah-panel">
      <div className="ra-panel-cabecera">
        <div>
          <h2>Historial de reportes de ausentes</h2>
          <p>Consulta reportes generados anteriormente y abre su información guardada.</p>
        </div>
      </div>
      {error && <div className="ra-aviso ra-error" role="alert"><FiAlertCircle />{error}</div>}
      <form className="ra-filtros" onSubmit={buscar}>
        <label className="ra-busqueda">
          <FiSearch />
          <input
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar por examen, asignatura o administrador..."
          />
        </label>
        <button className="ra-boton-secundario" type="submit">Buscar</button>
      </form>
      <div className="ra-tabla-contenedor">
        <table className="ra-tabla">
          <thead>
            <tr><th>ID</th><th>Examen</th><th>Asignatura</th><th>Fecha de generación</th><th>Generado por</th><th>Ausentes</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {historial.map((item) => (
              <tr key={item.idReporte}>
                <td>RAU-{String(item.idReporte).padStart(3, '0')}</td>
                <td className="ra-texto-fuerte">{item.nombreExamen || 'Examen eliminado'}</td>
                <td>{item.asignatura || '—'}</td>
                <td>{fechaHoraLegible(item.fechaGeneracion)}</td>
                <td>{item.nombreGenerador}</td>
                <td>{item.totalAusentes}</td>
                <td>
                  <button
                    className="ra-boton-primario"
                    onClick={() => ver(item.idReporte)}
                    disabled={cargandoDetalle}
                  >
                    <FiFileText /> Ver
                  </button>
                </td>
              </tr>
            ))}
            {!cargando && historial.length === 0 && (
              <tr><td colSpan="7" className="ra-vacio">Todavía no hay reportes de ausentes generados.</td></tr>
            )}
            {cargando && <tr><td colSpan="7" className="ra-vacio">Cargando historial...</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="ra-conteo">Mostrando {historial.length} reportes de ausentes</p>
    </section>
  )
}
