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
