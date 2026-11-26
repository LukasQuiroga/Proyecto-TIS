import { useEffect, useState } from 'react'
import { FiRefreshCw, FiTrash2, FiWifiOff } from 'react-icons/fi'
import api from '../../services/api.js'
import { descartarOperacion, obtenerEstadoCola, reintentarOperacion } from '../../offline/outbox.js'
import { leerEstadoPreparacionIngreso } from '../../offline/prepararDatosIngreso.js'
import './EstadoConexion.css'

function mensajePreparacion(estado) {
  if (!estado || estado.estado === 'error') return ''
  if (estado.estado === 'preparando') {
    return `Guardando datos para uso sin conexión: ${estado.completados} de ${estado.total || '…'} registros.`
  }
  if (estado.estado === 'listo') {
    const avisoFallos = estado.fallidos ? ` Quedaron ${estado.fallidos} consultas sin guardar.` : ''
    return `Datos offline listos: ${estado.examenes} exámenes y ${estado.estudiantes} estudiantes.${avisoFallos}`
  }
  return ''
}

export default function EstadoConexion() {
  const [sinConexion, setSinConexion] = useState(() => !navigator.onLine)
  const [cola, setCola] = useState({ pendientes: 0, revision: 0, rechazadas: 0, operaciones: [] })
  const [mostrarCola, setMostrarCola] = useState(false)
  const [avisoCambio, setAvisoCambio] = useState(() => mensajePreparacion(leerEstadoPreparacionIngreso()))

  useEffect(() => {
    let activo = true
    const actualizar = () => setSinConexion(!navigator.onLine)
    const avisarCacheOffline = () => setSinConexion(true)
    const actualizarCola = () => {
      void obtenerEstadoCola().then((estado) => {
        if (activo) setCola(estado)
      })
    }
    const cambioEnCola = (evento) => {
      setAvisoCambio(
        `El cambio ${evento.detail?.method || ''} quedó guardado en este dispositivo y se enviará al recuperar internet.`,
      )
      actualizarCola()
    }
    const cambioParaRevision = () => {
      setAvisoCambio('La conexión se interrumpió durante el envío. El cambio quedó en revisión para evitar duplicarlo automáticamente.')
      actualizarCola()
    }
    const preparandoIngreso = () => {
      setAvisoCambio('Preparando exámenes y validaciones para registrar ingresos sin conexión...')
    }
    const ingresoPreparado = (evento) => {
      const cantidad = evento.detail?.examenes ?? 0
      const total = evento.detail?.total ?? cantidad
      setAvisoCambio(
        cantidad > 0
          ? `Ingreso offline preparado para ${cantidad} de ${total} examen${total === 1 ? '' : 'es'} de este estudiante.`
          : 'No se encontraron exámenes disponibles para preparar el ingreso offline.',
      )
    }
    const ingresoNoPreparado = () => {
      setAvisoCambio('No se pudieron preparar los datos de ingreso offline. Mantén la conexión e inténtalo de nuevo.')
    }
    const sincronizacionIngreso = (evento) => {
      setAvisoCambio(mensajePreparacion(evento.detail))
    }
    const sincronizacionCompleta = () => {
      void obtenerEstadoCola().then((estado) => {
        if (!activo) return
        setCola(estado)
        if (estado.pendientes === 0 && estado.revision === 0 && estado.rechazadas === 0) {
          setAvisoCambio('Los cambios pendientes se sincronizaron.')
        }
      })
    }
    const temporizador = setTimeout(actualizarCola, 0)
    window.addEventListener('online', actualizar)
    window.addEventListener('offline', actualizar)
    window.addEventListener('exampass:offline-cache', avisarCacheOffline)
    window.addEventListener('exampass:online-response', actualizar)
    window.addEventListener('exampass:outbox-updated', actualizarCola)
    window.addEventListener('exampass:offline-operation-queued', cambioEnCola)
    window.addEventListener('exampass:offline-operation-review', cambioParaRevision)
    window.addEventListener('exampass:offline-sync-complete', sincronizacionCompleta)
    window.addEventListener('exampass:offline-admission-preparing', preparandoIngreso)
    window.addEventListener('exampass:offline-admission-ready', ingresoPreparado)
    window.addEventListener('exampass:offline-admission-failed', ingresoNoPreparado)
    window.addEventListener('exampass:offline-admission-sync', sincronizacionIngreso)
    return () => {
      activo = false
      clearTimeout(temporizador)
      window.removeEventListener('online', actualizar)
      window.removeEventListener('offline', actualizar)
      window.removeEventListener('exampass:offline-cache', avisarCacheOffline)
      window.removeEventListener('exampass:online-response', actualizar)
      window.removeEventListener('exampass:outbox-updated', actualizarCola)
      window.removeEventListener('exampass:offline-operation-queued', cambioEnCola)
      window.removeEventListener('exampass:offline-operation-review', cambioParaRevision)
      window.removeEventListener('exampass:offline-sync-complete', sincronizacionCompleta)
      window.removeEventListener('exampass:offline-admission-preparing', preparandoIngreso)
      window.removeEventListener('exampass:offline-admission-ready', ingresoPreparado)
      window.removeEventListener('exampass:offline-admission-failed', ingresoNoPreparado)
      window.removeEventListener('exampass:offline-admission-sync', sincronizacionIngreso)
    }
  }, [])

  const totalCola = cola.pendientes + cola.revision + cola.rechazadas
  const resumenCola = [
    cola.pendientes > 0 && `${cola.pendientes} por sincronizar`,
    cola.revision > 0 && `${cola.revision} requieren revisión`,
    cola.rechazadas > 0 && `${cola.rechazadas} rechazados por el servidor`
  ]
    .filter(Boolean)
    .join(', ')
  if (!sinConexion && totalCola === 0 && !avisoCambio) return null

  return (
    <div className="estado-conexion-offline" role="status" aria-live="polite">
      {sinConexion && <FiWifiOff aria-hidden="true" />}
      <div className="estado-conexion-contenido">
        {avisoCambio && <span className="estado-conexion-aviso-cambio">{avisoCambio}</span>}
        <span>
          {sinConexion
            ? 'Sin conexión con el servidor. Se muestran consultas realizadas previamente en este dispositivo.'
            : `Cambios offline: ${resumenCola}.`}
          {sinConexion && totalCola > 0 && ` Cola local: ${resumenCola}.`}
          {sinConexion && ' Los cambios compatibles se guardarán en la cola local.'}
        </span>
        {totalCola > 0 && (
          <button
            type="button"
            className="estado-conexion-ver-cola"
            onClick={() => setMostrarCola((abierta) => !abierta)}
            aria-expanded={mostrarCola}
          >
            {mostrarCola ? 'Ocultar cambios' : `Ver cambios (${totalCola})`}
          </button>
        )}
        {mostrarCola && (
          <ul className="estado-conexion-lista">
            {cola.operaciones.map((operacion) => (
              <li key={operacion.id}>
                <div>
                  <strong>
                    {operacion.method} {operacion.url}
                  </strong>
                  <span>{operacion.mensaje || `Estado: ${operacion.estado}`}</span>
                </div>
                <div className="estado-conexion-acciones">
                  {operacion.estado === 'revision' ? (
                    <button
                      type="button"
                      onClick={() => void reintentarOperacion(operacion.id, api)}
                      disabled={sinConexion}
                      title="Reintentar cambio"
                    >
                      <FiRefreshCw aria-hidden="true" /> Reintentar
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void descartarOperacion(operacion.id, api)}
                    disabled={operacion.estado === 'sincronizando'}
                    title="Descartar cambio"
                  >
                    <FiTrash2 aria-hidden="true" /> Descartar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {mostrarCola && cola.revision > 0 && (
          <small>
            Reintentar un cambio con resultado incierto puede duplicarlo si el servidor ya lo
            procesó.
          </small>
        )}
      </div>
    </div>
  )
}
