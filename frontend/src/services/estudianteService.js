const API_ESTUDIANTES = "/api/estudiantes";

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

export async function consultarEstudiantes({
  busqueda = "",
  estado = "TODOS",
  carrera = "",
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

  if (estado) {
    parametros.set(
      "estado",
      estado
    );
  }

  if (carrera) {
    parametros.set(
      "carrera",
      carrera
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
      `${API_ESTUDIANTES}?${parametros.toString()}`
    );

  return procesarRespuesta(respuesta);
}

export async function obtenerEstudiante(
  idUsuario
) {

  const respuesta =
    await fetch(
      `${API_ESTUDIANTES}/${idUsuario}`
    );

  return procesarRespuesta(respuesta);
}

export async function obtenerCarreras() {

  const respuesta =
    await fetch(
      `${API_ESTUDIANTES}/carreras`
    );

  return procesarRespuesta(respuesta);
}