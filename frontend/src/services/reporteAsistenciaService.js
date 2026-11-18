import api from "./api";

export async function listarExamenesParaReporte(filtros = {}) {
  const params = {};
  if (filtros.buscar?.trim()) params.buscar = filtros.buscar.trim();
  if (filtros.fecha) params.fecha = filtros.fecha;
  const { data } = await api.get("/reportes/asistencia/examenes", { params });
  return data;
}

export async function generarReporteAsistencia(idExamen) {
  const { data } = await api.post(`/reportes/asistencia/examenes/${idExamen}`);
  return data;
}

export async function listarHistorialReportes(buscar = "") {
  const { data } = await api.get("/reportes/asistencia/historial", {
    params: buscar.trim() ? { buscar: buscar.trim() } : {},
  });
  return data;
}

export async function obtenerReporteAsistencia(idReporte) {
  const { data } = await api.get(`/reportes/asistencia/${idReporte}`);
  return data;
}

export async function descargarReporteAsistencia(idReporte) {
  const { data } = await api.get(`/reportes/asistencia/${idReporte}/descarga`, {
    responseType: "blob",
  });
  return data;
}

export async function consultarReporteAusentes(idExamen) {
  const { data } = await api.get(
    `/reportes/asistencia/ausentes/examenes/${idExamen}`,
  );
  return data;
}

export async function generarReporteAusentes(idExamen) {
  const { data } = await api.post(
    `/reportes/asistencia/ausentes/examenes/${idExamen}`,
  );
  return data;
}

export async function listarHistorialAusentes(buscar = "") {
  const { data } = await api.get("/reportes/asistencia/ausentes/historial", {
    params: buscar.trim() ? { buscar: buscar.trim() } : {},
  });
  return data;
}

export async function obtenerReporteAusentes(idReporte) {
  const { data } = await api.get(`/reportes/asistencia/ausentes/${idReporte}`);
  return data;
}
