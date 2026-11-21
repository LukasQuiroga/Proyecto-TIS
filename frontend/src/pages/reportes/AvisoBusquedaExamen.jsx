import { FiAlertTriangle, FiX } from 'react-icons/fi'
import './AvisoBusquedaExamen.css'

export default function AvisoBusquedaExamen({ tipo, onClose }) {
  if (!tipo) return null

  const esLimite = tipo === 'limite'
  const titulo = esLimite
    ? 'Límite de búsqueda'
    : 'Caracteres no permitidos'

  return (
    <div className="aviso-busqueda-overlay">
      <section
        className="aviso-busqueda-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="aviso-busqueda-titulo"
        aria-describedby="aviso-busqueda-mensaje"
      >
        <button
          type="button"
          className="aviso-busqueda-cerrar"
          aria-label="Cerrar aviso"
          onClick={onClose}
        >
          <FiX />
        </button>
        <span className="aviso-busqueda-icono" aria-hidden="true">
          <FiAlertTriangle />
        </span>
        <h2 id="aviso-busqueda-titulo">{titulo}</h2>
        <p id="aviso-busqueda-mensaje">
          {esLimite
            ? 'La búsqueda permite un máximo de 50 caracteres.'
            : 'Solo se permiten letras, números, espacios y el guion (-).'}
        </p>
        <button
          type="button"
          className="aviso-busqueda-confirmar"
          onClick={onClose}
        >
          Entendido
        </button>
      </section>
    </div>
  )
}
