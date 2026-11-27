import api from "./api";

export const listarEstudiantesExamen = async (idExamen) => {
  const respuesta = await api.get(
    `/expulsiones/examenes/${idExamen}/estudiantes`,
  );

  return respuesta.data;
};

export const listarHistorialExpulsiones = async (idExamen) => {
  const respuesta = await api.get(
    `/expulsiones/examenes/${idExamen}/historial`,
  );

  return respuesta.data;
};

export const registrarExpulsion = (datos) => {
  return api.post("/expulsiones", datos);
};

export const obtenerMensajeErrorExpulsion = (error) => {
  const estado = error?.response?.status;
  const mensajeBackend = error?.response?.data?.mensaje;

  if (estado === 401) {
    return "Tu sesión ha expirado. Inicia sesión nuevamente.";
  }

  if (estado === 403) {
    return "No tienes autorización para registrar expulsiones.";
  }

  if (typeof mensajeBackend === "string" && mensajeBackend.trim()) {
    return mensajeBackend;
  }

  if (estado === 409) {
    return "Este estudiante ya tiene una expulsión registrada en el examen.";
  }

  if (estado === 400) {
    return "Verifica los datos de la expulsión e intenta nuevamente.";
  }

  return "No se pudo registrar la expulsión. Intenta nuevamente.";
};
