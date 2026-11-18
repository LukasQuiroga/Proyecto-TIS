
import api from "./api";

// Consulta los indicadores de ingresos registrados.
// Si se proporciona idExamen, obtiene el resumen de ese examen.
export async function obtenerResumenIngresos(idExamen = "") {
  const params = idExamen ? { idExamen } : {};

  const { data } = await api.get(
    "/ingresos/examenes/registrados/resumen",
    { params }
  );

  return data;
}
