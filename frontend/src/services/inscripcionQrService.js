
import api from "./api";

export const obtenerMateriasDocenteQr = async () => {
  const respuesta = await api.get(
    "/inscripciones-qr/materias/docente"
  );

  if (!Array.isArray(respuesta.data)) {
    throw new Error(
      "No se pudo obtener la lista de materias del docente."
    );
  }

  return respuesta.data;
};

export const generarQrInscripcion = async (idMateria) => {
  if (!idMateria) {
    throw new Error("Debe seleccionar una materia");
  }

  const respuesta = await api.post(
    `/inscripciones-qr/materias/${encodeURIComponent(idMateria)}/generar`
  );

  return respuesta.data;
};

export const inscribirEstudianteConQr = async (token) => {
  if (typeof token !== "string" || !token.trim()) {
    throw new Error("El codigo QR es obligatorio");
  }

  const respuesta = await api.post(
    "/inscripciones-qr/inscribir",
    {
      token: token.trim(),
    }
  );

  return respuesta.data;
};

export const obtenerMensajeErrorQr = (error) => {
  if (error?.response?.status === 401) {
    return "Tu sesion ha expirado. Inicia sesion nuevamente.";
  }

  if (error?.response?.status === 403) {
    return "No tienes permisos para realizar esta operacion.";
  }

  if (error?.response?.status === 409) {
    return "El estudiante ya esta inscrito o existe un conflicto de inscripcion.";
  }
  if (error?.response?.status === 400) {
       return "El código QR es inválido, ha expirado o no existe. Solicita un nuevo código a tu docente.";
  }

  const mensajeBackend = error?.response?.data;

  if (typeof mensajeBackend === "string" && mensajeBackend.trim()) {
    return mensajeBackend;
  }

  if (
    typeof mensajeBackend?.message === "string" &&
    mensajeBackend.message.trim()
  ) {
    return mensajeBackend.message;
  }

  if (
    typeof mensajeBackend?.detail === "string" &&
    mensajeBackend.detail.trim()
  ) {
    return mensajeBackend.detail;
  }

  return error?.message || "No se pudo completar la operacion.";
};
