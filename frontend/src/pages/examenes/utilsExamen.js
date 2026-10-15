const sinAcentos = (valor) =>
  String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

export const formatearTipoEvaluacion = (valor) => {
  const clave = sinAcentos(valor);

  const mapa = {
    PARCIAL: "Parcial",
    FINAL: "Final",
    PRACTICO: "Práctico",
    RECUPERATORIO: "Recuperatorio",
  };

  if (mapa[clave]) {
    return mapa[clave];
  }

  return valor ? String(valor) : "—";
};

export const obtenerEstadoExamen = (valor) => {
  const clave = sinAcentos(valor).replace(/\s+/g, "_");

  const estados = {
    ACTIVO: { clave: "ACTIVO", etiqueta: "Activo", clase: "activo" },
    PROGRAMADO: {
      clave: "PROGRAMADO",
      etiqueta: "Programado",
      clase: "programado",
    },
    EN_PREPARACION: {
      clave: "EN_PREPARACION",
      etiqueta: "En preparación",
      clase: "preparacion",
    },
    INACTIVO: { clave: "INACTIVO", etiqueta: "Inactivo", clase: "inactivo" },
  };

  if (estados[clave]) {
    return estados[clave];
  }

  return {
    clave: "SIN_ESTADO",
    etiqueta: valor ? String(valor) : "—",
    clase: "desconocido",
  };
};

export const obtenerEstadoRecurso = (valor) => {
  const clave = sinAcentos(valor).replace(/\s+/g, "_");

  const estados = {
    DISPONIBLE: { etiqueta: "Disponible", clase: "disponible" },
    EN_PROCESO: { etiqueta: "En proceso", clase: "proceso" },
    NO_DISPONIBLE: { etiqueta: "No disponible", clase: "no-disponible" },
  };

  if (estados[clave]) {
    return estados[clave];
  }

  return {
    etiqueta: valor ? String(valor) : "—",
    clase: "desconocido",
  };
};

export const obtenerNombreAsignatura = (examen) => {
  if (!examen) {
    return "—";
  }

  return (
    examen.nombreAsignatura ||
    examen.asignatura?.nombreAsignatura ||
    examen.asignatura ||
    examen.materia?.nombreAsignatura ||
    "—"
  );
};

export const obtenerEstadoConfiguracion = (examen) => {
  const estaConfigurado = Boolean(
    examen?.fechaExamen &&
    examen?.horaInicio &&
    examen?.horaFin &&
    Number.isInteger(examen?.duracionMinutos) &&
    examen.duracionMinutos > 0,
  );

  if (estaConfigurado) {
    return {
      etiqueta: "Programado",
      clase: "programado",
    };
  }

  return {
    etiqueta: "Sin configurar",
    clase: "sin-configurar",
  };
};
