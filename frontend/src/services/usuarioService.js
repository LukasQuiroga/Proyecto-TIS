import api from "./api";

const API = "/usuarios";

export const obtenerUsuarios = () => {
  return api.get(API);
};

export const registrarUsuario = (usuario, idUsuarioResponsable) => {
  return api.post(API, usuario, {
    headers: {
      "X-Usuario-Id": idUsuarioResponsable || "",
    },
  });
};

export const analizarImportacion = (datos) => {
  return api.post(`${API}/importar/analizar`, datos);
};

export const importarUsuarios = (datos, idUsuarioResponsable) => {
  return api.post(`${API}/importar`, datos, {
    headers: {
      "X-Usuario-Id": idUsuarioResponsable || "",
    },
  });
};

export const obtenerUsuario = (id) => {
  return api.get(`${API}/${id}`);
};

export const obtenerUsuariosPaginado = (pagina = 0, tamanio = 7) => {
  return api.get(`${API}/paginado`, {
    params: {
      page: pagina,
      size: tamanio,
    },
  });
};

export const modificarUsuario = (id, usuario) => {
  return api.put(`${API}/${id}`, usuario);
};

export const cambiarRolUsuario = (id, idRol) => {
  return api.put(`${API}/${id}/rol`, { idRol });
};
