const API_LOGS = "/api/logs";

function construirHeaders() {

  const credenciales =
    `Basic ${btoa("admin:exampass")}`;

  return {
    Authorization: credenciales,
    "X-Usuario-Id": "1",
  };
}

async function procesarRespuesta(respuesta) {

  if (respuesta.ok) {
    return respuesta.json();
  }

  let mensaje =
    "No fue posible completar la consulta.";

  try {

    const error =
      await respuesta.json();

    mensaje =
      error.detail ||
      error.message ||
      error.error ||
      mensaje;

  } catch {

    // La API no devolvió JSON.

  }

  throw new Error(mensaje);
}

export async function consultarLogs({
  busqueda = "",
  tipoAccion = "",
  fechaDesde = "",
  fechaHasta = "",
  estado = "TODOS",
  pagina = 0,
  tamanio = 10,
} = {}) {

  const parametros =
    new URLSearchParams();

  if (busqueda.trim()) {
    parametros.set(
      "busqueda",
      busqueda.trim()
    );
  }

  if (tipoAccion) {
    parametros.set(
      "tipoAccion",
      tipoAccion
    );
  }

  if (fechaDesde) {
    parametros.set(
      "fechaDesde",
      fechaDesde
    );
  }

  if (fechaHasta) {
    parametros.set(
      "fechaHasta",
      fechaHasta
    );
  }

  if (estado === "EXITOSA") {
    parametros.set(
      "exitosa",
      "true"
    );
  }

  if (estado === "NO_EXITOSA") {
    parametros.set(
      "exitosa",
      "false"
    );
  }

  parametros.set(
    "pagina",
    pagina
  );

  parametros.set(
    "tamanio",
    tamanio
  );

  const respuesta =
    await fetch(
      `${API_LOGS}?${parametros.toString()}`,
      {
        headers: construirHeaders(),
      }
    );

  return procesarRespuesta(respuesta);
}

export async function obtenerTiposLog() {

  const respuesta =
    await fetch(
      `${API_LOGS}/tipos`,
      {
        headers: construirHeaders(),
      }
    );

  return procesarRespuesta(respuesta);
}