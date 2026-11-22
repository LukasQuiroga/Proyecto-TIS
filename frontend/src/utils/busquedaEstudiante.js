
export const LIMITE_BUSQUEDA_ESTUDIANTE = 100;

export function limpiarBusquedaEstudiante(valor) {
  return String(valor ?? "")
    .replace(/[^\p{L}\p{M}\p{N} -]/gu, "")
    .slice(0, LIMITE_BUSQUEDA_ESTUDIANTE);
}
