import api from "./api";

const API = "/facultades";

export const obtenerFacultades = () => {
  return api.get(API);
};
