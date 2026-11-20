import api from "./api";

const API = "/situaciones-excepcionales";

export const obtenerCatalogoExamenes = () => {
  return api.get(`${API}/catalogo/examenes`);
};

export const obtenerEstudiantesExamen = (idExamen) => {
  return api.get(`${API}/catalogo/examenes/${idExamen}/estudiantes`);
};

export const registrarSituacionExcepcional = (datos) => {
  return api.post(API, datos);
};

export const adjuntarEvidenciaSituacion = (idSituacion, archivo) => {
  const datos = new FormData();
  datos.append("archivo", archivo);

  return api.post(`${API}/${idSituacion}/evidencia`, datos);
};

export const obtenerHistorialSituaciones = (filtros = {}) => {
  return api.get(API, {
    params: Object.fromEntries(
      Object.entries(filtros).filter(
        ([, valor]) => valor !== "" && valor !== null && valor !== undefined,
      ),
    ),
  });
};

export const obtenerDetalleSituacion = (idSituacion) => {
  return api.get(`${API}/${idSituacion}`);
};

export const descargarEvidenciaSituacion = (idSituacion) => {
  return api.get(`${API}/${idSituacion}/evidencia`, {
    responseType: "blob",
  });
};

export const obtenerErrorSituacion = (
  error,
  predeterminado = "No se pudo completar la operación.",
) => {
  const dato = error?.response?.data;

  if (typeof dato?.mensaje === "string" && dato.mensaje.trim()) {
    return dato.mensaje;
  }

  if (typeof dato?.message === "string" && dato.message.trim()) {
    return dato.message;
  }

  if (error?.response?.status === 403) {
    return "No tienes permisos para realizar esta operación.";
  }

  if (error?.response?.status === 401) {
    return "La sesión ha expirado. Inicia sesión nuevamente.";
  }

  return predeterminado;
};
