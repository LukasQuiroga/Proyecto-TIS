import api from './api'

// Los indicadores utilizan los mismos filtros de estudiante, examen y fecha.
export async function obtenerResumenIngresos(filtros = {}) {
  const { q, idExamen, fecha } = filtros
  const params = {}

  if (q?.trim()) params.q = q.trim()

  if (idExamen !== undefined && idExamen !== null && idExamen !== '') {
    params.idExamen = idExamen
  }

  if (fecha) params.fecha = fecha

  const { data } = await api.get('/ingresos/examenes/registrados/resumen', {
    params
  })

  return data
}

// Consulta de solo lectura para las vistas de pendientes y rechazos.
export async function listarRegistrosPorTipo(tipo, filtros = {}) {
  const params = { tipo }

  if (filtros.q?.trim()) params.q = filtros.q.trim()

  if (filtros.idExamen !== undefined && filtros.idExamen !== null && filtros.idExamen !== '') {
    params.idExamen = filtros.idExamen
  }

  if (filtros.fecha) params.fecha = filtros.fecha

  const { data } = await api.get('/ingresos/examenes/registrados/resumen/listado', { params })

  return data
}
