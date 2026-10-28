import api from "./api";

export async function obtenerExamenesIngreso() {
  const { data } = await api.get("/ingresos/examenes/disponibles");
  return data;
}

export async function obtenerEstudiantesIngreso(idExamen) {
  const { data } = await api.get(`/ingresos/examenes/${idExamen}/estudiantes`);
  return data;
}

export async function consultarHabilitacion(idExamen, idEstudiante) {
  const { data } = await api.get(
    `/ingresos/examenes/${idExamen}/estudiantes/${idEstudiante}/habilitacion`,
  );
  return data;
}

export async function identificarEstudiantePorDocumento(idExamen, documento) {
  const { data } = await api.get(
    `/ingresos/examenes/${idExamen}/identificar-documento`,
    {
      params: {
        documento: documento.trim(),
      },
    },
  );

  return data;
}

export async function identificarEstudiantePorCodigo(idExamen, codigo) {
  const { data } = await api.get(
    `/ingresos/examenes/${idExamen}/identificar-codigo`,
    { params: { codigo: codigo.trim() } },
  );
  return data;
}

export async function obtenerFotoEstudianteIdentificado(
  idExamen,
  idEstudiante,
) {
  const { data } = await api.get(
    `/ingresos/examenes/${idExamen}/estudiantes/${idEstudiante}/foto`,
    { responseType: "blob" },
  );
  return data;
}

export async function consultarIngresoRegistrado(idExamen, idEstudiante) {
  const { data } = await api.get(
    `/ingresos/examenes/${idExamen}/estudiantes/${idEstudiante}`,
  );
  return data;
}

export async function registrarIngresoExamen(idExamen, idEstudiante) {
  const { data } = await api.post(`/ingresos/examenes/${idExamen}/ingresos`, {
    idEstudiante,
  });
  return data;
}
