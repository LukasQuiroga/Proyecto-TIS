import api from './api'

export async function generarReporteAccesosIncorrectos(idExamen) {
  const { data } = await api.post(`/reportes/accesos-incorrectos/examenes/${idExamen}`)
  return data
}

export async function listarHistorialReportesAccesosIncorrectos(buscar = '') {
  const { data } = await api.get('/reportes/accesos-incorrectos/historial', {
    params: buscar.trim() ? { buscar: buscar.trim() } : {}
  })
  return data
}

export async function obtenerReporteAccesosIncorrectos(idReporte) {
  const { data } = await api.get(`/reportes/accesos-incorrectos/${idReporte}`)
  return data
}

export async function descargarReporteAccesosIncorrectos(idReporte) {
  const { data } = await api.get(`/reportes/accesos-incorrectos/${idReporte}/descarga`, {
    responseType: 'blob'
  })
  return data
}

export async function descargarReporteAccesosIncorrectosExcel(idReporte) {
  const { data } = await api.get(`/reportes/accesos-incorrectos/${idReporte}/excel`, {
    responseType: 'blob'
  })

  return data
}

export async function descargarReporteAccesosIncorrectosPdf(idReporte) {
  const { data } = await api.get(`/reportes/accesos-incorrectos/${idReporte}/pdf`, {
    responseType: 'blob'
  })

  return data
}
