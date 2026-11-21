import { useEffect, useMemo, useState } from 'react'
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCalendar,
  FiCheckCircle,
  FiDownload,
  FiFileText,
  FiSearch,
  FiUsers
} from 'react-icons/fi'
import {
  generarReporteAusentes,
  listarExamenesParaReporte
} from '../../services/reporteAsistenciaService'
import AvisoBusquedaExamen from './AvisoBusquedaExamen.jsx'
import { validarBusquedaExamen } from './validarBusquedaExamen.js'
import './ReporteAusentes.css'

const FECHA_MINIMA_FILTRO_EXAMEN = '2026-01-01'
const FECHA_MAXIMA_FILTRO_EXAMEN = '2028-12-31'

function fechaLegible(fecha) {
  if (!fecha) return 'Sin fecha programada'
  const [anio, mes, dia] = fecha.slice(0, 10).split('-')
  return `${dia}/${mes}/${anio}`
}

function horaLegible(hora) {
  return hora ? hora.slice(0, 5) : '—'
}

function campoCsv(valor) {
  const texto = String(valor ?? '')
  const seguro = /^[=+\-@]/.test(texto) ? `'${texto}` : texto
  return `"${seguro.replaceAll('"', '""')}"`
}

function descargarCsv(reporte) {
  const filas = [
    ['Reporte de ausentes'],
    ['Examen', reporte.nombreExamen],
    ['Asignatura', reporte.asignatura],
    ['Fecha del examen', reporte.fechaExamen],
    ['Hora del examen', reporte.horaInicio],
    ['Total de ausentes', reporte.totalAusentes],
    [],
    ['Código', 'Nombre completo', 'Estado'],
    ...reporte.estudiantesAusentes.map((estudiante) => [
      estudiante.codigoEstudiante,
      estudiante.nombreCompleto,
      'Ausente'
    ])
  ]
  const contenido = `\uFEFF${filas.map((fila) => fila.map(campoCsv).join(';')).join('\r\n')}`
  const url = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8' }))
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = `reporte-ausentes-${reporte.idExamen}.csv`
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function ReporteAusentes() {
  const [examenes, setExamenes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [fecha, setFecha] = useState('')
  const [filtros, setFiltros] = useState({ buscar: '', fecha: '', numero: 0 })
  const [cargandoExamenes, setCargandoExamenes] = useState(true)
  const [generandoId, setGenerandoId] = useState(null)
  const [reporte, setReporte] = useState(null)
  const [paso, setPaso] = useState('seleccion')
  const [busquedaAusente, setBusquedaAusente] = useState('')
  const [error, setError] = useState('')
  const [avisoBusqueda, setAvisoBusqueda] = useState(null)

  useEffect(() => {
    let vigente = true

    async function cargarExamenes() {
      try {
        const data = await listarExamenesParaReporte({
          buscar: filtros.buscar,
          fecha: filtros.fecha
        })
        if (vigente) setExamenes(Array.isArray(data) ? data : [])
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

    void cargarExamenes()
    return () => {
      vigente = false
    }
  }, [filtros])

  const ausentesVisibles = useMemo(() => {
    if (!reporte) return []
    const termino = busquedaAusente.trim().toLocaleLowerCase('es')
    return reporte.estudiantesAusentes.filter((estudiante) =>
      `${estudiante.nombreCompleto} ${estudiante.codigoEstudiante || ''}`
        .toLocaleLowerCase('es')
        .includes(termino)
    )
  }, [reporte, busquedaAusente])

  const buscarExamenes = (event) => {
    event.preventDefault()
    setError('')
    setCargandoExamenes(true)
    setFiltros((anterior) => ({
      buscar: busqueda,
      fecha,
      numero: anterior.numero + 1
    }))
  }

  const generar = async (idExamen) => {
    setGenerandoId(idExamen)
    setError('')
    try {
      const data = await generarReporteAusentes(idExamen)
      setReporte(data)
      setBusquedaAusente('')
      setPaso('confirmacion')
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          err.response?.data?.message ||
          'No se pudo generar el reporte de ausentes.'
      )
    } finally {
      setGenerandoId(null)
    }
  }

  const generarOtro = () => {
    setReporte(null)
    setPaso('seleccion')
    setError('')
  }

  return (
    <section className="ra-panel ra-ausentes-panel">
      {error && (
        <div className="ra-aviso ra-error" role="alert">
          <FiAlertCircle />
          {error}
        </div>
      )}

      {paso === 'seleccion' && (
        <>
          <div className="ra-panel-cabecera">
            <div>
              <h2>Seleccionar examen</h2>
              <p>Elige el examen para consultar los estudiantes que no ingresaron.</p>
            </div>
          </div>
          <form className="ra-filtros" onSubmit={buscarExamenes}>
            <label className="ra-busqueda">
              <FiSearch />
              <input
                value={busqueda}
                onChange={(event) => {
                  const valor = event.target.value
                  const validacion = validarBusquedaExamen(valor)
                  if (validacion) {
                    setAvisoBusqueda(validacion)
                    return
                  }
                  setBusqueda(valor)
                }}
                placeholder="Buscar por examen, asignatura o código..."
              />
            </label>
            <label className="ra-fecha">
              <span>Filtrar por fecha</span>
              <span className="ra-campo-fecha">
                <FiCalendar />
                <input
                  type="date"
                  min={FECHA_MINIMA_FILTRO_EXAMEN}
                  max={FECHA_MAXIMA_FILTRO_EXAMEN}
                  value={fecha}
                  onChange={(event) => setFecha(event.target.value)}
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
          <p className="ra-conteo">Mostrando {examenes.length} exámenes</p>
        </>
      )}

      {paso === 'confirmacion' && reporte && (
        <div className="ra-ausentes-confirmacion">
          <span className="ra-ausentes-icono-exito">
            <FiCheckCircle />
          </span>
          <h2>Reporte generado correctamente</h2>
          <p>El reporte de ausentes del examen “{reporte.nombreExamen}” está listo.</p>
          <div className="ra-ausentes-acciones">
            <button className="ra-boton-primario" onClick={() => setPaso('detalle')}>
              <FiFileText /> Ver reporte
            </button>
            <button className="ra-boton-secundario" onClick={generarOtro}>
              Generar otro reporte
            </button>
          </div>
        </div>
      )}

      {paso === 'detalle' && reporte && (
        <>
          <div className="ra-reporte-encabezado">
            <div>
              <button className="ra-ausentes-volver" onClick={generarOtro}>
                <FiArrowLeft /> Volver a exámenes
              </button>
              <span className="ra-etiqueta">VISTA PREVIA DEL REPORTE</span>
              <h2>Reporte de ausentes</h2>
              <p>Estudiantes asociados al examen que no registraron su ingreso.</p>
            </div>
            <button className="ra-boton-primario" onClick={() => descargarCsv(reporte)}>
              <FiDownload /> Descargar CSV
            </button>
          </div>
          <div className="ra-resumen ra-resumen-ausentes">
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
            <div className="ra-resumen-contador ra-total-ausentes">
              <span>
                <FiUsers /> Total de ausentes
              </span>
              <strong>{reporte.totalAusentes}</strong>
            </div>
            <div className="ra-resumen-contador">
              <span>
                <FiCheckCircle /> Total de asistentes
              </span>
              <strong>{reporte.totalAsistentes}</strong>
            </div>
            <div className="ra-resumen-contador ra-total-padron">
              <span>Total en padrón</span>
              <strong>{reporte.totalPadron}</strong>
            </div>
          </div>
          <div className="ra-lista-cabecera">
            <div>
              <h3>Lista de estudiantes ausentes</h3>
              <p>Ordenados por apellido y nombre.</p>
            </div>
            <label className="ra-busqueda ra-ausentes-busqueda">
              <FiSearch />
              <input
                value={busquedaAusente}
                onChange={(event) => setBusquedaAusente(event.target.value)}
                placeholder="Buscar estudiante por nombre o código..."
              />
            </label>
          </div>
          {reporte.totalPadron === 0 ? (
            <div className="ra-vacio-grande">
              <FiAlertCircle />
              <h3>No hay estudiantes asociados al examen</h3>
              <p>No se puede determinar la asistencia hasta que se asocien estudiantes.</p>
            </div>
          ) : reporte.totalAusentes === 0 ? (
            <div className="ra-vacio-grande ra-ausentes-vacio">
              <FiCheckCircle />
              <h3>No hay estudiantes ausentes</h3>
              <p>Todos los estudiantes asociados al examen registraron su ingreso.</p>
            </div>
          ) : (
            <div className="ra-tabla-contenedor">
              <table className="ra-tabla">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Código</th>
                    <th>Nombre completo</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {ausentesVisibles.map((estudiante, indice) => (
                    <tr key={estudiante.idEstudiante}>
                      <td>{indice + 1}</td>
                      <td>{estudiante.codigoEstudiante || '—'}</td>
                      <td className="ra-texto-fuerte">{estudiante.nombreCompleto}</td>
                      <td>
                        <span className="ra-estado ra-estado-ausente">Ausente</span>
                      </td>
                    </tr>
                  ))}
                  {ausentesVisibles.length === 0 && (
                    <tr>
                      <td colSpan="4" className="ra-vacio">
                        No hay coincidencias para la búsqueda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          <p className="ra-conteo">
            Mostrando {ausentesVisibles.length} de {reporte.totalAusentes} ausentes
          </p>
        </>
      )}
      <AvisoBusquedaExamen
        tipo={avisoBusqueda}
        onClose={() => setAvisoBusqueda(null)}
      />
    </section>
  )
}
