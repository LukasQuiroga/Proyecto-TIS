import api from "./api";

export const obtenerAsignaturas = () => {
  return api.get("/asignaturas");
};

export const buscarAsignaturas = (texto) => {
  return api.get("/asignaturas", {
    params: {
      buscar: texto,
    },
  });
};

export const obtenerAsignaturaPorId = (id) => {
  return api.get(`/asignaturas/${id}`);
};

export const obtenerGruposPorAsignatura = (idAsignatura) => {
  return api.get(`/asignaturas/${idAsignatura}/grupos`);
};

export const registrarAsignatura = (datos) => {
  return api.post("/asignaturas", datos);
};

export const obtenerDocentesActivos = (idFacultad) => {
  return api.get("/asignaturas/docentes", {
    params: {
      idFacultad,
    },
  });
};
