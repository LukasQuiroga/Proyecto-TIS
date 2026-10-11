import api from './api'

export const obtenerAsignaturas = () => {
  return api.get('/asignaturas')
}

export const buscarAsignaturas = (texto) => {
  return api.get('/asignaturas', {
    params: {
      buscar: texto
    }
  })
}

export const obtenerAsignaturaPorId = (id) => {
  return api.get(`/asignaturas/${id}`)
}
