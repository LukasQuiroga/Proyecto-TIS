import axios from 'axios'

const API = 'http://localhost:8080/api/roles'

export const obtenerRoles = () => {
  return axios.get(API)
}

export const obtenerRol = (id) => {
  return axios.get(`${API}/${id}`)
}
