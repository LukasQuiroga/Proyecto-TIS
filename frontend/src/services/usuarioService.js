import axios from 'axios'

const API = 'http://localhost:8080/api/usuarios'

export const obtenerUsuarios = () => {
  return axios.get(API)
}

export const obtenerUsuario = (id) => {
  return axios.get(`${API}/${id}`)
}

export const modificarUsuario = (id, usuario) => {
  return axios.put(
    `${API}/${id}`,

    usuario
  )
}
