import api from "./api";

const API_LOGS = "/logs";

export const TAMANIO_PAGINA_AUDITORIA = 10;

export async function consultarLogs({
  busqueda = "",
  tipoAccion = "",
  fechaDesde = "",
  fechaHasta = "",
  estado = "TODOS",
  pagina = 0,
  tamanio = TAMANIO_PAGINA_AUDITORIA,
} = {}) {
  const parametros = {
    pagina,
    tamanio,
  };

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

  const respuesta = await api.get(API_LOGS, {
    params: parametros,
  });

  return respuesta.data;
}

export async function obtenerTiposLog() {
  const respuesta = await api.get(`${API_LOGS}/tipos`);

  return respuesta.data;
}

export async function obtenerLogPorId(idLog) {
  const respuesta = await api.get(`${API_LOGS}/${idLog}`);

  return respuesta.data;
}
