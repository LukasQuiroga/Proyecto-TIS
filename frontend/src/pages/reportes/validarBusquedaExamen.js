export function validarBusquedaExamen(valor) {
  if (valor.length > 50) return "limite";
  if (/[^\p{L}\p{N}\s-]/u.test(valor)) return "caracteres";
  return null;
}
