
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

export const consultarQrActivo = async (idMateria) => {
  if (!idMateria) {
    throw new Error("Debe seleccionar una materia");
  }

  const respuesta = await api.get(
    `/inscripciones-qr/materias/${encodeURIComponent(idMateria)}/activo`
  );

  if (respuesta.status === 204) {
    return null;
  }

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

export const obtenerMensajeErrorQr = (error, operacion = "inscripcion") => {
  if (error?.response?.status === 401) {
    return "Tu sesión ha expirado. Inicia sesión nuevamente.";
  }

  if (error?.response?.status === 403) {
    return "No tienes permisos para realizar esta operación.";
  }

  if (error?.response?.status === 409) {
    if (operacion === "generar") {
      return "Esta materia ya tiene un código QR activo. Utiliza el existente o espera a que venza.";
    }

    return "El estudiante ya está inscrito o existe un conflicto de inscripción.";
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

  return error?.message || "No se pudo completar la operación.";
};
