import axios from 'axios'

const API = 'http://localhost:8080/api/roles'

export const obtenerRoles = () => {
  return axios.get(API)
}

export const obtenerRol = (id) => {
  return axios.get(`${API}/${id}`)
}

export const obtenerPermisos = () => {
  return axios.get('http://localhost:8080/api/permisos')
}

export const actualizarPermisosRol = (id, permisos) => {
  return axios.put(`${API}/${id}/permisos`, {
    permisos
  })
}
