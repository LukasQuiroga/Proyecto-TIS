import api from "./api";

const API = "/carreras";

export const obtenerCarreras = () => {
  return api.get(API);
};
