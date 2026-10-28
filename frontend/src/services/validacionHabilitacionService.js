import api from './api'

export async function obtenerExamenesIngreso() {
  const { data } = await api.get('/ingresos/examenes/disponibles')
  return data
}

export async function obtenerEstudiantesIngreso(idExamen) {
  const { data } = await api.get(`/ingresos/examenes/${idExamen}/estudiantes`)
  return data
}

export async function consultarHabilitacion(idExamen, idEstudiante) {
  const { data } = await api.get(
    `/ingresos/examenes/${idExamen}/estudiantes/${idEstudiante}/habilitacion`
  )
  return data
}

export async function identificarEstudiantePorDocumento(idExamen, documento) {
  const { data } = await api.get(
    `/ingresos/examenes/${idExamen}/identificar-documento`,
    {
      params: {
        documento: documento.trim(),
      },
    },
  )

  return data
}

export async function identificarEstudiantePorCodigo(idExamen, codigo) {
  const { data } = await api.get(
    `/ingresos/examenes/${idExamen}/identificar-codigo`,
    { params: { codigo: codigo.trim() } },
  )
  return data
}

export async function obtenerFotoEstudianteIdentificado(idExamen, idEstudiante) {
  const { data } = await api.get(
    `/ingresos/examenes/${idExamen}/estudiantes/${idEstudiante}/foto`,
    { responseType: "blob" },
  )
  return data
}

export async function listarIngresosRegistrados(filtros = {}) {
  const { q, idExamen, fecha } = filtros
  const params = {}
  if (q && q.trim() !== '') params.q = q.trim()
  if (idExamen !== undefined && idExamen !== null && idExamen !== '') params.idExamen = idExamen
  if (fecha) params.fecha = fecha
  const { data } = await api.get('/ingresos/examenes/registrados', { params })
  return data
}

export async function registrarIngreso(idExamen, idEstudiante) {
  const { data } = await api.post(`/ingresos/examenes/${idExamen}/ingresos`, {
    idEstudiante,
  })
  return data
}
