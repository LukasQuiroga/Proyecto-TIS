import api from "./api";

export const obtenerAmbientes = (params = {}) => {
  return api.get("/ambientes", { params });
};

export const obtenerAmbientePorId = (id) => {
  return api.get(`/ambientes/${id}`);
};

export const registrarAmbiente = (datos) => {
  return api.post("/ambientes", datos);
};

export const actualizarAmbiente = (id, datos) => {
  return api.put(`/ambientes/${id}`, datos);
};

export const verificarDisponibilidadAmbiente = (id, parametros) => {
  return api.get(`/ambientes/${id}/disponibilidad`, {
    params: parametros,
  });
};
