import api from './api'

export const obtenerFacultades = () => {
  return api.get('/facultades')
}

export const obtenerCarreras = () => {
  return api.get('/carreras')
}
