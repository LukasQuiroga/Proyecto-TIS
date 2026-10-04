import api from "./api";

const API = "/roles";

export const obtenerRoles = () => {
  return api.get(API);
};

export const obtenerRol = (id) => {
  return api.get(`${API}/${id}`);
};

export const obtenerPermisos = () => {
  return api.get("/permisos");
};

export const actualizarPermisosRol = (id, permisos) => {
  return api.put(`${API}/${id}/permisos`, {
    permisos,
  });
};

export const crearRol = (rol) => {
  return api.post(API, rol);
};
