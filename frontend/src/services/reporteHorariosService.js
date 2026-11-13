import api from './api'

export async function generarReporteHorarios(idExamen) {
  const { data } = await api.post(`/reportes/horarios/examenes/${idExamen}`)
  return data
}

export async function listarHistorialReportesHorarios(buscar = '') {
  const { data } = await api.get('/reportes/horarios/historial', {
    params: buscar.trim() ? { buscar: buscar.trim() } : {}
  })
  return data
}

export async function obtenerReporteHorarios(idReporte) {
  const { data } = await api.get(`/reportes/horarios/${idReporte}`)
  return data
}

export async function descargarReporteHorarios(idReporte) {
  const { data } = await api.get(`/reportes/horarios/${idReporte}/descarga`, {
    responseType: 'blob'
  })
  return data
}
