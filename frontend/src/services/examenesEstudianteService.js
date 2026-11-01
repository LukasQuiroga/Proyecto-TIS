import api from "./api";

export async function obtenerMisExamenes({ signal } = {}) {
  const respuesta = await api.get("/estudiante/examenes", {
    signal,
  });

  return respuesta.data;
}
