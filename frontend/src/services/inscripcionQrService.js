
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

export const renovarQrInscripcion = async (idMateria) => {
  if (!idMateria) {
    throw new Error("Debe seleccionar una materia");
  }

  const respuesta = await api.post(
    `/inscripciones-qr/materias/${encodeURIComponent(idMateria)}/renovar`
  );

  return respuesta.data;
};

export const desactivarQrInscripcion = async (idMateria) => {
  if (!idMateria) {
    throw new Error("Debe seleccionar una materia");
  }

  const respuesta = await api.patch(
    `/inscripciones-qr/materias/${encodeURIComponent(idMateria)}/desactivar`
  );

  return respuesta.data;
};

export const inscribirEstudianteConQr = async (token) => {
  if (typeof token !== "string" || !token.trim()) {
    throw new Error("El código QR es obligatorio");
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
  const estado = error?.response?.status;

  if (estado === 401) {
    return "Tu sesión ha expirado. Inicia sesión nuevamente.";
  }

  if (estado === 403) {
    return "No tienes permisos para realizar esta operación.";
  }

  if (estado === 409) {
    if (operacion === "generar") {
      return "Esta materia ya tiene un código QR activo. Utiliza el existente o espera a que venza.";
    }

    if (operacion === "renovar") {
      return "No existe un código QR activo para renovar. Genera uno nuevo.";
    }

    if (operacion === "desactivar") {
      return "No existe un código QR activo para desactivar.";
    }

    return "El estudiante ya está inscrito o existe un conflicto de inscripción.";
  }

  const mensajeBackend = error?.response?.data;

  if (
    typeof mensajeBackend === "string" &&
    mensajeBackend.trim()
  ) {
    return mensajeBackend;
  }

  if (
    typeof mensajeBackend?.detail === "string" &&
    mensajeBackend.detail.trim()
  ) {
    return mensajeBackend.detail;
  }

  if (
    typeof mensajeBackend?.message === "string" &&
    mensajeBackend.message.trim()
  ) {
    return mensajeBackend.message;
  }

  if (estado === 400) {
    if (operacion === "inscripcion") {
      return "El código QR es inválido, ha expirado o fue desactivado. Solicita un código válido.";
    }

    return "No se pudo procesar la operación solicitada.";
  }

  return error?.message || "No se pudo completar la operación.";
};
