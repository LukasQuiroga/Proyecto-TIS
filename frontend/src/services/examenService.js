import api from "./api";

const API = "/examenes";

export const obtenerExamenes = (params = {}) => {
  return api.get(API, { params });
};

export const obtenerExamenPorId = (id) => {
  return api.get(`${API}/${id}`);
};

export const registrarExamen = (datos) => {
  return api.post(API, datos);
};

export const actualizarExamen = (id, datos) => {
  return api.put(`${API}/${id}`, datos);
};

export const configurarExamen = (id, datos) => {
  return api.put(`${API}/${id}/configuracion`, datos);
};

export const obtenerAsignaturasParaExamen = () => {
  return api.get("/usuarios/materias");
};

export const obtenerMensajeErrorExamen = (error) => {
  if (error?.response?.status === 401) {
    return "Tu sesión ha expirado. Inicia sesión nuevamente.";
  }

  if (error?.response?.status === 403) {
    return "No tienes permisos para realizar esta operación.";
  }

  const mensajeBackend = error?.response?.data;

  if (typeof mensajeBackend === "string" && mensajeBackend.trim()) {
    return mensajeBackend;
  }

  if (
    typeof mensajeBackend?.mensaje === "string" &&
    mensajeBackend.mensaje.trim()
  ) {
    return mensajeBackend.mensaje;
  }

  if (
    typeof mensajeBackend?.message === "string" &&
    mensajeBackend.message.trim()
  ) {
    return mensajeBackend.message;
  }

  return "No se pudieron cargar los exámenes. Intenta nuevamente.";
};
