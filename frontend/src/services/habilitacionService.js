import api from "./api";

const BASE = "/habilitaciones";

export const listarHabilitaciones = async (idExamen) => {
  const { data } = await api.get(`${BASE}/examenes/${idExamen}`);
  return data;
};

export const consultarHabilitacion = async (idExamen, idEstudiante) => {
  const { data } = await api.get(
    `${BASE}/examenes/${idExamen}/estudiantes/${idEstudiante}`,
  );
  return data;
};

export const actualizarHabilitacion = async (idExamen, payload) => {
  const { data } = await api.put(`${BASE}/examenes/${idExamen}`, payload);
  return data;
};

export const listarMotivos = async () => {
  const { data } = await api.get(`${BASE}/motivos`);
  return data;
};

export const mensajeErrorHabilitacion = (error) => {
  const code = error?.response?.status;
  if (code === 401) return "Tu sesión terminó. Inicia sesión nuevamente.";
  if (code === 403)
    return "No eres el docente encargado de la materia y grupo de este examen.";
  if (code === 404) return "No se encontró el examen o estudiante solicitado.";
  if (code === 409)
    return "Los datos cambiaron o el examen no admite modificaciones. Actualiza el listado.";
  const data = error?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  return (
    data?.detail ||
    data?.mensaje ||
    data?.message ||
    error?.message ||
    "Ocurrió un error inesperado."
  );
};
