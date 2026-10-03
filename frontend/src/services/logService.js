import api from "./api";

const API_LOGS = "/logs";

export async function consultarLogs({
  busqueda = "",
  tipoAccion = "",
  fechaDesde = "",
  fechaHasta = "",
  estado = "TODOS",
  pagina = 0,
  tamanio = 10,
} = {}) {
  const parametros = {};

  if (busqueda.trim()) {
    parametros.busqueda = busqueda.trim();
  }

  if (tipoAccion) {
    parametros.tipoAccion = tipoAccion;
  }

  if (fechaDesde) {
    parametros.fechaDesde = fechaDesde;
  }

  if (fechaHasta) {
    parametros.fechaHasta = fechaHasta;
  }

  if (estado === "EXITOSA") {
    parametros.exitosa = true;
  }

  if (estado === "NO_EXITOSA") {
    parametros.exitosa = false;
  }

  parametros.pagina = pagina;
  parametros.tamanio = tamanio;

  const respuesta = await api.get(API_LOGS, {
    params: parametros,
  });

  return respuesta.data;
}

export async function obtenerTiposLog() {
  const respuesta = await api.get(`${API_LOGS}/tipos`);

  return respuesta.data;
}
