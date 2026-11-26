import api from "./api";

export async function obtenerExamenesIngreso() {
  const { data } = await api.get("/ingresos/examenes/disponibles");
  return data;
}

export async function obtenerEstudiantesIngreso(idExamen) {
  const { data } = await api.get(
    "/ingresos/examenes/" + idExamen + "/estudiantes",
  );
  return data;
}

export async function consultarHabilitacion(idExamen, idEstudiante) {
  const { data } = await api.get(
    "/ingresos/examenes/" +
      idExamen +
      "/estudiantes/" +
      idEstudiante +
      "/habilitacion",
  );
  return data;
}

export async function identificarEstudiantePorDocumento(idExamen, documento) {
  const { data } = await api.get(
    "/ingresos/examenes/" + idExamen + "/identificar-documento",
    {
      params: { documento: documento.trim() },
    },
  );
  return data;
}

export async function identificarEstudiantePorDocumentoSinExamen(documento) {
  const { data } = await api.get("/ingresos/examenes/identificar-documento", {
    params: { documento: documento.trim() },
  });

  await prepararIngresoOffline(data.idEstudiante);

  return data;
}

export async function identificarEstudiantePorCodigo(idExamen, codigo) {
  const { data } = await api.get(
    "/ingresos/examenes/" + idExamen + "/identificar-codigo",
    {
      params: { codigo: codigo.trim() },
    },
  );
  return data;
}

export async function identificarEstudiantePorQr(idExamen, token) {
  const { data } = await api.post(
    `/ingresos/examenes/${idExamen}/identificar-qr`,
    { token },
  );
  await prepararIngresoOffline(data.idEstudiante, [idExamen]);
  return data;
}

export async function obtenerFotoEstudianteIdentificado(
  idExamen,
  idEstudiante,
) {
  const { data } = await api.get(
    "/ingresos/examenes/" + idExamen + "/estudiantes/" + idEstudiante + "/foto",
    { responseType: "blob" },
  );
  return data;
}

export async function obtenerFotoEstudiantePorDocumento(
  idEstudiante,
  documento,
) {
  const { data } = await api.get(
    `/ingresos/examenes/identificar-documento/${idEstudiante}/foto`,
    {
      params: { documento: documento.trim() },
      responseType: "blob",
    },
  );

  return data;
}

export async function consultarIngresoRegistrado(idExamen, idEstudiante) {
  const { data } = await api.get(
    "/ingresos/examenes/" + idExamen + "/estudiantes/" + idEstudiante,
  );
  return data;
}

export async function registrarIntentoIngresoDuplicado(idExamen, idEstudiante) {
  await api.post(
    "/ingresos/examenes/" +
      idExamen +
      "/estudiantes/" +
      idEstudiante +
      "/intentos-duplicados",
  );
}

export async function registrarIntentoIngresoDuplicadoConFoto(
  idExamen,
  idEstudiante,
  fotoFile,
) {
  const formData = new FormData();
  formData.append("foto", fotoFile);
  await api.post(
    "/ingresos/examenes/" +
      idExamen +
      "/estudiantes/" +
      idEstudiante +
      "/intentos-duplicados",
    formData,
  );
}

export async function obtenerDetalleIntento(idIntento) {
  const { data } = await api.get(
    "/ingresos/examenes/intentos-no-autorizados/" + idIntento,
  );
  return data;
}

export async function resolverIncidencia(idIntento, veredicto) {
  const { data } = await api.put(
    "/ingresos/examenes/intentos-no-autorizados/" + idIntento + "/resolver",
    { veredicto },
  );
  return data;
}

export async function obtenerFotoIntento(idIntento) {
  const { data } = await api.get(
    "/ingresos/examenes/intentos-no-autorizados/" + idIntento + "/foto",
    {
      responseType: "blob",
    },
  );
  return data;
}

export async function registrarIngresoExamen(idExamen, idEstudiante) {
  const solicitud = { idEstudiante };
  if (!navigator.onLine)
    solicitud.fechaHoraDispositivo = new Date().toISOString();

  const { data } = await api.post(
    "/ingresos/examenes/" + idExamen + "/ingresos",
    solicitud,
  );
  return data;
}

export async function listarIngresosRegistrados(filtros = {}) {
  const { q, idExamen, fecha } = filtros;
  const params = {};
  if (q && q.trim() !== "") params.q = q.trim();
  if (idExamen !== undefined && idExamen !== null && idExamen !== "")
    params.idExamen = idExamen;
  if (fecha) params.fecha = fecha;
  const { data } = await api.get("/ingresos/examenes/registrados", { params });
  return data;
}

export async function registrarIngreso(idExamen, idEstudiante) {
  const { data } = await api.post(
    "/ingresos/examenes/" + idExamen + "/ingresos",
    { idEstudiante },
  );
  return data;
}

export async function obtenerIngresoRegistrado(idIngreso) {
  const { data } = await api.get("/ingresos/examenes/registrados/" + idIngreso);
  return data;
}

export async function actualizarIngresoRegistrado(idIngreso, payload) {
  const { data } = await api.put(
    "/ingresos/examenes/registrados/" + idIngreso,
    payload,
  );
  return data;
}

export async function listarIntentosNoAutorizados(filtros = {}) {
  const { data } = await api.get("/ingresos/examenes/intentos-no-autorizados", {
    params: filtros,
  });
  return data;
}

export async function verificarIngresoYRegistrarRechazo(
  idExamen,
  idEstudiante,
) {
  const { data } = await api.post(
    `/ingresos/examenes/${idExamen}/estudiantes/${idEstudiante}/habilitacion/verificar-ingreso`,
  );
  return data;
}

export async function obtenerExamenesIdentificacionDocumento() {
  const { data } = await api.get(
    "/ingresos/examenes/identificar-documento/examenes",
  );
  return data;
}

export async function consultarHabilitacionPorDocumento(
  idExamen,
  idEstudiante,
) {
  const { data } = await api.get(
    `/ingresos/examenes/identificar-documento/${idExamen}/estudiantes/${idEstudiante}/habilitacion`,
  );
  return data;
}

export async function identificarEstudiantePorCodigoSinExamen(codigo) {
  const { data } = await api.get("/ingresos/examenes/identificar-codigo", {
    params: {
      codigo: codigo.trim(),
    },
  });

  await prepararIngresoOffline(data.idEstudiante);

  return data;
}

async function prepararIngresoOffline(idEstudiante, idsExamenes = null) {
  if (!navigator.onLine || !idEstudiante) return;

  window.dispatchEvent(new Event("exampass:offline-admission-preparing"));

  try {
    const todosLosExamenes = await obtenerExamenesIdentificacionDocumento();
    const examenes = idsExamenes
      ? todosLosExamenes.filter((examen) =>
          idsExamenes.some(
            (idExamen) => Number(idExamen) === Number(examen.idExamen),
          ),
        )
      : todosLosExamenes;
    const examenesValidos = examenes.filter((examen) => examen?.idExamen);
    let siguiente = 0;
    let preparados = 0;

    const prepararExamen = async () => {
      while (siguiente < examenesValidos.length) {
        const examen = examenesValidos[siguiente++];
        const idExamen = Number(examen.idExamen);
        const resultados = await Promise.allSettled([
          comprobarCorrespondencia(idExamen, Number(idEstudiante)),
          consultarHabilitacion(idExamen, Number(idEstudiante)),
          consultarIngresoRegistrado(idExamen, Number(idEstudiante)),
        ]);

        if (resultados.some((resultado) => resultado.status === "rejected")) {
          console.warn(
            "No se prepararon todos los datos offline para el examen",
            idExamen,
          );
        } else {
          preparados += 1;
        }
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(2, examenesValidos.length) }, () =>
        prepararExamen(),
      ),
    );

    if (preparados === 0 && examenesValidos.length > 0) {
      window.dispatchEvent(new Event("exampass:offline-admission-failed"));
    } else {
      window.dispatchEvent(
        new CustomEvent("exampass:offline-admission-ready", {
          detail: {
            examenes: preparados,
            total: examenesValidos.length,
            idEstudiante,
          },
        }),
      );
    }
  } catch (error) {
    console.warn(
      "No se pudieron preparar todos los datos de ingreso offline:",
      error,
    );
    window.dispatchEvent(new Event("exampass:offline-admission-failed"));
  }
}

export async function obtenerFotoEstudiantePorCodigo(idEstudiante, codigo) {
  const { data } = await api.get(
    `/ingresos/examenes/identificar-codigo/${idEstudiante}/foto`,
    {
      params: {
        codigo: codigo.trim(),
      },
      responseType: "blob",
    },
  );

  return data;
}

export async function comprobarCorrespondencia(idExamen, idEstudiante) {
  const { data } = await api.get(
    `/ingresos/examenes/${idExamen}/estudiantes/${idEstudiante}/correspondencia`,
  );

  return data;
}

export async function listarEstudiantesPendientes(idExamen = "") {
  const params = {};

  if (idExamen !== "" && idExamen != null) {
    params.idExamen = idExamen;
  }

  const { data } = await api.get("/ingresos/examenes/pendientes", { params });

  return data;
}

export async function obtenerEstudiantePendiente(idExamen, idEstudiante) {
  const { data } = await api.get(
    `/ingresos/examenes/pendientes/${idExamen}/estudiantes/${idEstudiante}`,
  );

  return data;
}
