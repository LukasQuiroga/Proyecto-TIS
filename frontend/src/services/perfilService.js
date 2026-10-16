import api from "./api";

export const obtenerMiPerfil = async () => {
  const { data } = await api.get("/perfil/me");
  return data;
};

export const actualizarTelefonoPerfil = async (celular) => {
  const { data } = await api.patch("/perfil/me/telefono", { celular });
  return data;
};

export const cambiarContrasenaPerfil = async (datos) => {
  const { data } = await api.put("/perfil/me/contrasena", datos);
  return data;
};

export const actualizarFotoPerfil = async (archivo) => {
  const formData = new FormData();
  formData.append("foto", archivo);
  const { data } = await api.put("/perfil/me/foto", formData);
  return data;
};

export const obtenerFotoPerfil = async () => {
  const { data } = await api.get("/perfil/me/foto", {
    responseType: "blob",
  });
  return data;
};

export const obtenerMensajeErrorPerfil = (error) => {
  const body = error?.response?.data;
  if (typeof body?.message === "string") return body.message;
  if (typeof body?.detail === "string") return body.detail;
  if (typeof body?.error === "string") return body.error;
  if (error?.response?.status === 413)
    return "La fotografía supera el tamaño permitido.";
  if (error?.response?.status === 401)
    return "Tu sesión ha expirado. Inicia sesión nuevamente.";
  if (error?.response?.status === 403)
    return "No tienes permisos para realizar esta operación.";
  return "Ocurrió un error. Inténtalo nuevamente.";
};
