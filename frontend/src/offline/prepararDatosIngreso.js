import api from "../services/api.js";
import {
  comprobarCorrespondencia,
  consultarHabilitacion,
  consultarIngresoRegistrado,
  obtenerEstudiantesIngreso,
  obtenerExamenesIdentificacionDocumento,
} from "../services/validacionHabilitacionService.js";

const CLAVE_ESTADO = "exampass_preparacion_ingreso";
const preparacionesActivas = new Map();

function publicarEstado(estado) {
  try {
    sessionStorage.setItem(CLAVE_ESTADO, JSON.stringify(estado));
  } catch {
    // La preparación sigue aunque el navegador no permita guardar el estado visual.
  }

  window.dispatchEvent(
    new CustomEvent("exampass:offline-admission-sync", { detail: estado }),
  );
}

async function ejecutarConLimite(items, limite, procesar) {
  let siguiente = 0;
  const trabajadores = Array.from(
    { length: Math.min(limite, items.length) },
    async () => {
      while (siguiente < items.length) {
        const indice = siguiente++;
        await procesar(items[indice], indice);
      }
    },
  );
  await Promise.all(trabajadores);
}

export function leerEstadoPreparacionIngreso() {
  try {
    return JSON.parse(sessionStorage.getItem(CLAVE_ESTADO) || "null");
  } catch {
    return null;
  }
}

export function prepararDatosIngresoDocente(idUsuario) {
  const clave = String(idUsuario);
  if (!navigator.onLine || !idUsuario) return Promise.resolve(null);
  if (preparacionesActivas.has(clave)) return preparacionesActivas.get(clave);

  const preparacion = (async () => {
    let completados = 0;
    let fallidos = 0;
    const base = {
      idUsuario: clave,
      estado: "preparando",
      examenes: 0,
      estudiantes: 0,
      completados: 0,
      total: 0,
      fallidos: 0,
    };
    publicarEstado(base);

    try {
      try {
        await navigator.storage?.persist?.();
      } catch {
        // El navegador puede denegar almacenamiento persistente; IndexedDB sigue disponible.
      }

      const listaExamenes = await obtenerExamenesIdentificacionDocumento();
      const examenes = Array.isArray(listaExamenes) ? listaExamenes : [];
      const listas = new Array(examenes.length);
      await ejecutarConLimite(examenes, 4, async (examen, indice) => {
        try {
          const estudiantes = await obtenerEstudiantesIngreso(examen.idExamen);
          listas[indice] = {
            examen,
            estudiantes: Array.isArray(estudiantes) ? estudiantes : [],
          };
        } catch (error) {
          fallidos += 1;
          console.warn(
            "No se pudo preparar la lista de estudiantes del examen:",
            examen.idExamen,
            error,
          );
          listas[indice] = { examen, estudiantes: [] };
        }
      });

      const pares = listas.flatMap(({ examen, estudiantes }) =>
        estudiantes.map((estudiante) => ({ examen, estudiante })),
      );
      const estudiantesUnicos = new Map();
      pares.forEach(({ estudiante }) => {
        const codigo = String(estudiante.codigoUniversitario || "").trim();
        if (codigo && estudiante.idEstudiante)
          estudiantesUnicos.set(String(estudiante.idEstudiante), {
            ...estudiante,
            codigo,
          });
      });

      const total = pares.length + estudiantesUnicos.size;
      const actualizar = () =>
        publicarEstado({
          idUsuario: clave,
          estado: "preparando",
          examenes: examenes.length,
          estudiantes: pares.length,
          completados,
          total,
          fallidos,
        });
      actualizar();

      await ejecutarConLimite(
        Array.from(estudiantesUnicos.values()),
        4,
        async (estudiante) => {
          try {
            await api.get("/ingresos/examenes/identificar-codigo", {
              params: { codigo: estudiante.codigo },
            });
          } catch (error) {
            fallidos += 1;
            console.warn(
              "No se pudo preparar la identificación offline del estudiante:",
              estudiante.idEstudiante,
              error,
            );
          } finally {
            completados += 1;
            actualizar();
          }
        },
      );

      await ejecutarConLimite(pares, 4, async ({ examen, estudiante }) => {
        const idExamen = Number(examen.idExamen);
        const idEstudiante = Number(estudiante.idEstudiante);
        const resultados = await Promise.allSettled([
          comprobarCorrespondencia(idExamen, idEstudiante),
          consultarHabilitacion(idExamen, idEstudiante),
          consultarIngresoRegistrado(idExamen, idEstudiante),
        ]);
        if (resultados.some((resultado) => resultado.status === "rejected"))
          fallidos += 1;
        completados += 1;
        actualizar();
      });

      const resultado = {
        idUsuario: clave,
        estado: "listo",
        examenes: examenes.length,
        estudiantes: pares.length,
        completados,
        total,
        fallidos,
      };
      publicarEstado(resultado);
      return resultado;
    } catch (error) {
      console.warn(
        "No se pudieron preparar los datos de ingreso offline:",
        error,
      );
      const resultado = {
        idUsuario: clave,
        estado: "error",
        examenes: 0,
        estudiantes: 0,
        completados,
        total: 0,
        fallidos: fallidos + 1,
      };
      publicarEstado(resultado);
      return resultado;
    }
  })().finally(() => preparacionesActivas.delete(clave));

  preparacionesActivas.set(clave, preparacion);
  return preparacion;
}
