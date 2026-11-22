import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiEye,
  FiFilter,
  FiRefreshCw,
  FiSearch,
  FiUsers,
  FiX
} from 'react-icons/fi'

import {
  listarEstudiantesPendientes,
  obtenerEstudiantePendiente,
  obtenerExamenesIngreso
} from '../../services/validacionHabilitacionService'

import { obtenerResumenIngresos } from '../../services/resumenIngresosService'
import {
  FECHA_MINIMA_CONSULTA,
  FECHA_MAXIMA_CONSULTA,
  fechaConsultaValida,
  obtenerMensajeFechaInvalida
} from '../../utils/fechaConsulta'

import {
  LIMITE_BUSQUEDA_ESTUDIANTE,
  limpiarBusquedaEstudiante
} from '../../utils/busquedaEstudiante'

import './EstudiantesPendientes.css'

const REGISTROS_POR_PAGINA = 5

function obtenerMensajeError(error) {
  const estado = error?.response?.status

  if (estado === 401) {
    return 'Tu sesión expiró. Inicia sesión nuevamente.'
  }

  if (estado === 403) {
    return 'No tienes permisos para consultar esta información.'
  }

  if (estado === 404) {
    return 'La información solicitada no está disponible.'
  }

  if (estado >= 500) {
    return 'El servidor no pudo completar la consulta.'
  }

  return 'No se pudo cargar la información. Intenta nuevamente.'
}

function normalizarTexto(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function EstudiantesPendientes() {
  const [examenes, setExamenes] = useState([])
  const [idExamen, setIdExamen] = useState('')

  const [estudiantes, setEstudiantes] = useState([])
  const [resumen, setResumen] = useState(null)

  const [busqueda, setBusqueda] = useState('')
  const [fecha, setFecha] = useState('')
  const [errorFecha, setErrorFecha] = useState('')
  const fechaInputRef = useRef(null)
  const [carrera, setCarrera] = useState('')
  const [pagina, setPagina] = useState(1)

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [errorExamenes, setErrorExamenes] = useState('')

  const solicitudActual = useRef(0)

  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null)

  const [detalleEstudiante, setDetalleEstudiante] = useState(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [errorDetalle, setErrorDetalle] = useState('')

  const solicitudDetalleActual = useRef(0)
  const botonDetalleAnterior = useRef(null)
  const botonCerrarDetalle = useRef(null)

  useEffect(() => {
    let activo = true

    obtenerExamenesIngreso()
      .then((datos) => {
        if (!activo) return

        if (!Array.isArray(datos)) {
          throw new Error('Lista de exámenes inválida')
        }

        setExamenes(datos)
      })
      .catch(() => {
        if (activo) {
          setErrorExamenes('No se pudieron cargar los exámenes disponibles.')
        }
      })

    return () => {
      activo = false
    }
  }, [])

  const cargarDatos = useCallback(async (examen = '') => {
    const solicitud = ++solicitudActual.current

    setCargando(true)
    setError('')

    try {
      const [datosEstudiantes, datosResumen] = await Promise.all([
        listarEstudiantesPendientes(examen),
        obtenerResumenIngresos(examen)
      ])

      if (solicitud !== solicitudActual.current) {
        return
      }

      if (!Array.isArray(datosEstudiantes)) {
        throw new Error('Listado de estudiantes inválido')
      }

      const indicadores = ['ingresados', 'pendientes', 'rechazados']

      if (
        !datosResumen ||
        !indicadores.every(
          (clave) => Number.isSafeInteger(datosResumen[clave]) && datosResumen[clave] >= 0
        )
      ) {
        throw new Error('Indicadores inválidos')
      }

      setEstudiantes(datosEstudiantes)
      setResumen(datosResumen)
    } catch (err) {
      if (solicitud !== solicitudActual.current) {
        return
      }

      setEstudiantes([])
      setResumen(null)
      setError(obtenerMensajeError(err))
    } finally {
      if (solicitud === solicitudActual.current) {
        setCargando(false)
      }
    }
  }, [])

  useEffect(() => {
    let activo = true

    Promise.resolve().then(() => {
      if (activo) {
        cargarDatos(idExamen)
      }
    })

    return () => {
      activo = false
      solicitudActual.current += 1
    }
  }, [idExamen, cargarDatos])

  const carrerasDisponibles = useMemo(() => {
    const carreras = new Set()

    estudiantes.forEach((estudiante) => {
      const valor = estudiante.carrera?.trim()

      if (valor) {
        carreras.add(valor)
      }
    })

    return Array.from(carreras).sort((a, b) => a.localeCompare(b, 'es'))
  }, [estudiantes])

  const estudiantesFiltrados = useMemo(() => {
    const texto = normalizarTexto(busqueda)

    return estudiantes.filter((estudiante) => {
      const nombre = normalizarTexto(estudiante.nombreCompleto)

      const codigo = normalizarTexto(estudiante.codigoUniversitario)

      const coincideBusqueda = !texto || nombre.includes(texto) || codigo.includes(texto)

      const coincideFecha = !fecha || estudiante.fechaExamen === fecha

      const coincideCarrera = !carrera || estudiante.carrera === carrera

      return coincideBusqueda && coincideFecha && coincideCarrera
    })
  }, [estudiantes, busqueda, fecha, carrera])

  const totalPaginas = Math.max(1, Math.ceil(estudiantesFiltrados.length / REGISTROS_POR_PAGINA))

  const paginaActual = Math.min(pagina, totalPaginas)

  const estudiantesPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * REGISTROS_POR_PAGINA

    return estudiantesFiltrados.slice(inicio, inicio + REGISTROS_POR_PAGINA)
  }, [estudiantesFiltrados, paginaActual])

  const inicioRegistro =
    estudiantesFiltrados.length === 0 ? 0 : (paginaActual - 1) * REGISTROS_POR_PAGINA + 1

  const finRegistro = Math.min(paginaActual * REGISTROS_POR_PAGINA, estudiantesFiltrados.length)

  const cambiarExamen = (valor) => {
    if (fechaInputRef.current) {
      fechaInputRef.current.value = ''
    }

    setIdExamen(valor)
    setPagina(1)
    setCarrera('')
    setFecha('')
    setErrorFecha('')
  }

  const cambiarBusqueda = (valor) => {
    setBusqueda(limpiarBusquedaEstudiante(valor))
    setPagina(1)
  }

  const cambiarFecha = (campo) => {
    const valor = campo.value

    if (!campo.validity.valid || !fechaConsultaValida(valor)) {
      setErrorFecha(obtenerMensajeFechaInvalida())
      return
    }

    setErrorFecha('')
    setFecha(valor)
    setPagina(1)
  }

  const cambiarCarrera = (valor) => {
    setCarrera(valor)
    setPagina(1)
  }

  const limpiarFiltros = () => {
    if (fechaInputRef.current) {
      fechaInputRef.current.value = ''
    }

    setBusqueda('')
    setFecha('')
    setErrorFecha('')
    setCarrera('')
    setPagina(1)
    cambiarExamen('')
  }

  const actualizar = () => {
    if (!cargando) {
      cargarDatos(idExamen)
    }
  }
  const cargarDetalle = async (estudiante) => {
    const solicitud = ++solicitudDetalleActual.current

    setCargandoDetalle(true)
    setErrorDetalle('')
    setDetalleEstudiante(null)

    try {
      const detalle = await obtenerEstudiantePendiente(estudiante.idExamen, estudiante.idEstudiante)

      if (solicitud !== solicitudDetalleActual.current) {
        return
      }

      if (
        !detalle ||
        typeof detalle !== 'object' ||
        Array.isArray(detalle) ||
        detalle.idEstudiante == null ||
        detalle.idExamen == null
      ) {
        throw new Error('El detalle recibido no es válido')
      }

      setDetalleEstudiante(detalle)
    } catch (error) {
      if (solicitud !== solicitudDetalleActual.current) {
        return
      }

      if (error?.response?.status === 404) {
        setErrorDetalle('El estudiante ya no figura como pendiente o no está disponible.')
      } else {
        setErrorDetalle(obtenerMensajeError(error))
      }
    } finally {
      if (solicitud === solicitudDetalleActual.current) {
        setCargandoDetalle(false)
      }
    }
  }

  const abrirDetalle = (estudiante, event) => {
    botonDetalleAnterior.current = event.currentTarget
    setEstudianteSeleccionado(estudiante)
    cargarDetalle(estudiante)
  }

  const cerrarDetalle = () => {
    solicitudDetalleActual.current += 1

    setEstudianteSeleccionado(null)
    setDetalleEstudiante(null)
    setCargandoDetalle(false)
    setErrorDetalle('')

    botonDetalleAnterior.current?.focus()
  }

  const actualizarDetalle = () => {
    if (estudianteSeleccionado && !cargandoDetalle) {
      cargarDetalle(estudianteSeleccionado)
    }
  }
  useEffect(() => {
    if (!estudianteSeleccionado) {
      return
    }

    const manejarEscape = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        solicitudDetalleActual.current += 1
        setEstudianteSeleccionado(null)
        setDetalleEstudiante(null)
        setCargandoDetalle(false)
        setErrorDetalle('')
        botonDetalleAnterior.current?.focus()
      }
    }

    document.addEventListener('keydown', manejarEscape)

    const focoPendiente = requestAnimationFrame(() => {
      botonCerrarDetalle.current?.focus()
    })

    return () => {
      document.removeEventListener('keydown', manejarEscape)
      cancelAnimationFrame(focoPendiente)
    }
  }, [estudianteSeleccionado])

  const hayFiltros = busqueda.trim() !== '' || idExamen !== '' || fecha !== '' || carrera !== '' || Boolean(errorFecha)

  return (
    <main className="pendientes-pagina">
      <header className="pendientes-encabezado">
        <div>
          <h1>Estudiantes pendientes</h1>
          <p>Consulte los estudiantes que todavía no registraron su ingreso al examen.</p>
        </div>

        <button
          type="button"
          className="pendientes-actualizar"
          onClick={actualizar}
          disabled={cargando}
        >
          <FiRefreshCw />
          Actualizar
        </button>
      </header>

      <section className="pendientes-resumen" aria-label="Resumen de ingresos">
        <h2>Resumen de ingresos</h2>

        <div className="pendientes-tarjetas">
          <article className="pendientes-tarjeta">
            <FiCheckCircle className="pendientes-icono ingresados" />

            <div>
              <span>Ingresados</span>
              <strong>{cargando ? '...' : (resumen?.ingresados ?? '-')}</strong>
            </div>
          </article>

          <article className="pendientes-tarjeta">
            <FiClock className="pendientes-icono pendientes" />

            <div>
              <span>Pendientes</span>
              <strong>{cargando ? '...' : (resumen?.pendientes ?? '-')}</strong>
            </div>
          </article>

          <article className="pendientes-tarjeta">
            <FiAlertTriangle className="pendientes-icono rechazados" />

            <div>
              <span>Rechazados</span>
              <strong>{cargando ? '...' : (resumen?.rechazados ?? '-')}</strong>
            </div>
          </article>
        </div>
      </section>

      <section className="pendientes-contenedor">
        <div className="pendientes-filtros-titulo">
          <h2>
            <FiFilter />
            Filtros de búsqueda
          </h2>

          <button
            type="button"
            className="pendientes-limpiar"
            onClick={limpiarFiltros}
            disabled={!hayFiltros}
          >
            <FiX />
            Limpiar filtros
          </button>
        </div>

        <div className="pendientes-filtros">
          <div className="pendientes-selector">
            <label htmlFor="pendientes-busqueda">Buscar estudiante</label>

            <div className="pendientes-buscador">
              <FiSearch />

              <input
                id="pendientes-busqueda"
                type="search"
                value={busqueda}
                onChange={(event) => cambiarBusqueda(event.target.value)}
                placeholder="Nombre o código universitario"
                maxLength={LIMITE_BUSQUEDA_ESTUDIANTE}
              />
            </div>
          </div>

          <div className="pendientes-selector">
            <label htmlFor="pendientes-examen">Examen</label>

            <select
              id="pendientes-examen"
              value={idExamen}
              onChange={(event) => cambiarExamen(event.target.value)}
            >
              <option value="">Todos los exámenes</option>

              {examenes.map((examen) => (
                <option key={examen.idExamen} value={examen.idExamen}>
                  {examen.codigo && examen.nombreExamen
                    ? `${examen.codigo} - ${examen.nombreExamen}`
                    : examen.nombreExamen || examen.codigo || `Examen ${examen.idExamen}`}
                </option>
              ))}
            </select>
          </div>

          <div className="pendientes-selector">
            <label htmlFor="pendientes-fecha">Fecha del examen</label>

            <input
              ref={fechaInputRef}
              id="pendientes-fecha"
              type="date"
              min={FECHA_MINIMA_CONSULTA}
              max={FECHA_MAXIMA_CONSULTA}
              defaultValue=""
              aria-invalid={Boolean(errorFecha)}
              aria-describedby={errorFecha ? 'error-pendientes-fecha' : undefined}
              onChange={(event) => cambiarFecha(event.currentTarget)}
              onBlur={(event) => {
                const campo = event.currentTarget
                if (!campo.validity.valid || !fechaConsultaValida(campo.value)) {
                  setErrorFecha(obtenerMensajeFechaInvalida())
                } else {
                  setErrorFecha('')
                }
              }}
            />
            {errorFecha && (
              <p id="error-pendientes-fecha" role="alert" style={{ color: '#b42318', fontSize: '0.875rem' }}>
                {errorFecha}
              </p>
            )}
          </div>

          <div className="pendientes-selector">
            <label htmlFor="pendientes-carrera">Carrera</label>

            <select
              id="pendientes-carrera"
              value={carrera}
              onChange={(event) => cambiarCarrera(event.target.value)}
            >
              <option value="">Todas las carreras</option>

              {carrerasDisponibles.map((nombre) => (
                <option key={nombre} value={nombre}>
                  {nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {errorExamenes && (
          <p className="pendientes-error" role="alert">
            {errorExamenes}
          </p>
        )}

        {error && (
          <div className="pendientes-error" role="alert">
            {error}

            <button type="button" onClick={actualizar}>
              Reintentar
            </button>
          </div>
        )}

        {!error && (
          <>
            <div className="pendientes-tabla-titulo">
              <h2>Listado de estudiantes pendientes</h2>

              {!cargando && (
                <span>
                  {estudiantesFiltrados.length} de {estudiantes.length} registros
                </span>
              )}
            </div>

            {cargando ? (
              <p className="pendientes-cargando" role="status">
                Cargando estudiantes pendientes...
              </p>
            ) : estudiantesFiltrados.length === 0 ? (
              <div className="pendientes-vacio">
                <FiUsers size={32} />

                <p>
                  {hayFiltros
                    ? 'No se encontraron estudiantes con los filtros seleccionados.'
                    : 'No hay estudiantes pendientes de ingreso.'}
                </p>
              </div>
            ) : (
              <>
                <div className="pendientes-tabla-contenedor">
                  <table className="pendientes-tabla">
                    <thead>
                      <tr>
                        <th>Código universitario</th>
                        <th>Estudiante</th>
                        <th>Examen</th>
                        <th>Carrera</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>

                    <tbody>
                      {estudiantesPaginados.map((estudiante) => (
                        <tr key={`${estudiante.idExamen}-${estudiante.idEstudiante}`}>
                          <td>{estudiante.codigoUniversitario || '-'}</td>

                          <td>{estudiante.nombreCompleto || '-'}</td>

                          <td>{estudiante.nombreExamen || '-'}</td>

                          <td>{estudiante.carrera || '-'}</td>

                          <td>
                            <span className="pendientes-estado">Pendiente</span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="pendientes-boton-ver"
                              onClick={(event) => abrirDetalle(estudiante, event)}
                              aria-label={`Ver detalle de ${estudiante.nombreCompleto}`}
                              title="Ver detalle"
                            >
                              <FiEye />
                              Ver
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pendientes-paginacion">
                  <span>
                    Mostrando {inicioRegistro}–{finRegistro} de {estudiantesFiltrados.length}
                  </span>

                  <div className="pendientes-paginas">
                    <button
                      type="button"
                      aria-label="Página anterior"
                      onClick={() => setPagina(paginaActual - 1)}
                      disabled={paginaActual === 1}
                    >
                      <FiChevronLeft />
                    </button>

                    {Array.from({ length: totalPaginas }, (_, indice) => indice + 1).map(
                      (numero) => (
                        <button
                          key={numero}
                          type="button"
                          className={paginaActual === numero ? 'activa' : ''}
                          aria-label={`Página ${numero}`}
                          aria-current={paginaActual === numero ? 'page' : undefined}
                          onClick={() => setPagina(numero)}
                        >
                          {numero}
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      aria-label="Página siguiente"
                      onClick={() => setPagina(paginaActual + 1)}
                      disabled={paginaActual === totalPaginas}
                    >
                      <FiChevronRight />
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </section>

      {estudianteSeleccionado && (
        <div
          className="pendientes-modal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              cerrarDetalle()
            }
          }}
        >
          <div
            className="pendientes-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pendientes-detalle-titulo"
            aria-describedby="pendientes-detalle-descripcion"
          >
            <div className="pendientes-modal-header">
              <div>
                <h2 id="pendientes-detalle-titulo">Detalle del estudiante</h2>

                <p id="pendientes-detalle-descripcion">
                  Información del estudiante pendiente de ingreso.
                </p>
              </div>

              <div className="pendientes-modal-acciones">
                <button
                  type="button"
                  className="pendientes-modal-actualizar"
                  onClick={actualizarDetalle}
                  disabled={cargandoDetalle}
                  title="Actualizar detalle"
                  aria-label="Actualizar detalle del estudiante"
                >
                  <FiRefreshCw />
                </button>

                <button
                  ref={botonCerrarDetalle}
                  type="button"
                  className="pendientes-modal-cerrar"
                  onClick={cerrarDetalle}
                  aria-label="Cerrar detalle"
                  title="Cerrar"
                >
                  <FiX />
                </button>
              </div>
            </div>

            <div className="pendientes-modal-body">
              {cargandoDetalle ? (
                <div className="pendientes-modal-cargando" role="status">
                  Cargando información del estudiante...
                </div>
              ) : errorDetalle ? (
                <div className="pendientes-modal-error" role="alert">
                  <FiAlertTriangle />

                  <p>{errorDetalle}</p>

                  <button
                    type="button"
                    onClick={() => {
                      actualizarDetalle()
                      actualizar()
                    }}
                  >
                    Reintentar consulta
                  </button>
                </div>
              ) : detalleEstudiante ? (
                <>
                  <div className="pendientes-modal-estado">
                    <span className="pendientes-estado">Pendiente de ingreso</span>
                  </div>

                  <div className="pendientes-modal-seccion">
                    <h3>Información del estudiante</h3>

                    <dl className="pendientes-modal-grid">
                      <div className="pendientes-modal-campo">
                        <dt>Código universitario</dt>
                        <dd>{detalleEstudiante.codigoUniversitario || '-'}</dd>
                      </div>

                      <div className="pendientes-modal-campo">
                        <dt>Nombre completo</dt>
                        <dd>{detalleEstudiante.nombreCompleto || '-'}</dd>
                      </div>

                      <div className="pendientes-modal-campo">
                        <dt>Carrera</dt>
                        <dd>{detalleEstudiante.carrera || '-'}</dd>
                      </div>

                      <div className="pendientes-modal-campo">
                        <dt>Estado</dt>
                        <dd>{detalleEstudiante.estado || 'Pendiente'}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="pendientes-modal-seccion">
                    <h3>Información del examen</h3>

                    <dl className="pendientes-modal-grid">
                      <div className="pendientes-modal-campo">
                        <dt>Examen</dt>
                        <dd>{detalleEstudiante.nombreExamen || '-'}</dd>
                      </div>

                      <div className="pendientes-modal-campo">
                        <dt>Fecha del examen</dt>
                        <dd>{detalleEstudiante.fechaExamen || '-'}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="pendientes-modal-nota">
                    <FiClock />

                    <p>Este estudiante todavía figura como pendiente de ingreso al examen.</p>
                  </div>
                </>
              ) : (
                <p className="pendientes-modal-vacio">No hay información disponible.</p>
              )}
            </div>

            <div className="pendientes-modal-footer">
              <button type="button" className="pendientes-modal-volver" onClick={cerrarDetalle}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default EstudiantesPendientes
