import axios from "axios";

const API = "http://localhost:8080/api/usuarios";

export const obtenerUsuarios = () => {
    return axios.get(API);

};

export const registrarUsuario = (
    usuario,
    idUsuarioResponsable
    ) => {
    return axios.post(
        API,
        usuario,
        {
            headers: {
                "X-Usuario-Id":
                    idUsuarioResponsable || ""
            }
        }
    );

};

export const analizarImportacion = (datos) => {
    return axios.post(
        `${API}/importar/analizar`,
        datos
    );

};

export const importarUsuarios = (
    datos,
    idUsuarioResponsable
    ) => {
    return axios.post(
        `${API}/importar`,
        datos,
        {
            headers: {
                "X-Usuario-Id":
                    idUsuarioResponsable || ""
            }
        }
    );

};

export const obtenerUsuario = (id) => {
    return axios.get(
        `${API}/${id}`
    );

};

export const modificarUsuario = (
    id,
    usuario
    ) => {
    return axios.put(
        `${API}/${id}`,
        usuario
    );

};

export const cambiarRolUsuario = (
    id,
    idRol
    ) => {
    return axios.put(
        `${API}/${id}/rol`,
        {
            idRol
        }
    );

};