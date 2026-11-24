import { useEffect, useState } from 'react'
import { FiWifiOff } from 'react-icons/fi'
import './EstadoConexion.css'

export default function EstadoConexion() {
  const [sinConexion, setSinConexion] = useState(() => !navigator.onLine)

  useEffect(() => {
    const actualizar = () => setSinConexion(!navigator.onLine)
    const avisarCacheOffline = () => setSinConexion(true)
    window.addEventListener('online', actualizar)
    window.addEventListener('offline', actualizar)
    window.addEventListener('exampass:offline-cache', avisarCacheOffline)
    window.addEventListener('exampass:online-response', actualizar)
    return () => {
      window.removeEventListener('online', actualizar)
      window.removeEventListener('offline', actualizar)
      window.removeEventListener('exampass:offline-cache', avisarCacheOffline)
      window.removeEventListener('exampass:online-response', actualizar)
    }
  }, [])

  if (!sinConexion) return null

  return (
    <div className="estado-conexion-offline" role="status" aria-live="polite">
      <FiWifiOff aria-hidden="true" />
      <span>
        Sin conexión con el servidor. Se muestran consultas guardadas en este dispositivo; para
        guardar cambios necesitas internet.
      </span>
    </div>
  )
}
