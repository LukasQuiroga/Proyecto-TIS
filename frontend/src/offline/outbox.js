import {
  ALMACEN_COLA,
  abrirBaseOffline,
  obtenerIdUsuarioActual,
} from "./cacheApi.js";

const MAX_BYTES_OPERACION = 15_000_000;
const MAX_BYTES_COLA = 50_000_000;
const MAX_OPERACIONES_COLA = 100;
let sincronizacionActiva = false;

function notificarCola() {
  window.dispatchEvent(new Event("exampass:outbox-updated"));
}

function crearId() {
  return (
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

function leerHeader(headers, nombre) {
  return (
    headers?.get?.(nombre) ||
    headers?.[nombre] ||
    headers?.[nombre.toLowerCase()]
  );
}

function serializarCuerpo(data) {
  if (data == null) return { tipo: "vacio", valor: null, bytes: 0 };

  if (data instanceof FormData) {
    const entradas = Array.from(data.entries()).map(([nombre, valor]) => {
      if (valor instanceof Blob) {
        return {
          nombre,
          tipo: "archivo",
          valor,
          nombreArchivo: valor instanceof File ? valor.name : nombre,
          bytes: valor.size,
        };
      }
      return { nombre, tipo: "texto", valor, bytes: String(valor).length };
    });
    return {
      tipo: "formdata",
      valor: entradas,
      bytes: entradas.reduce((total, entrada) => total + entrada.bytes, 0),
    };
  }

  if (data instanceof URLSearchParams) {
    const valor = data.toString();
    return { tipo: "urlencoded", valor, bytes: valor.length };
  }

  if (data instanceof Blob)
    return { tipo: "blob", valor: data, bytes: data.size };
  if (data instanceof ArrayBuffer)
    return { tipo: "arraybuffer", valor: data, bytes: data.byteLength };

  const bytes =
    typeof data === "string" ? data.length : JSON.stringify(data).length;
  return {
    tipo: typeof data === "string" ? "texto" : "json",
    valor: data,
    bytes,
  };
}

function restaurarCuerpo(cuerpo) {
  if (cuerpo.tipo === "formdata") {
    const formData = new FormData();
    cuerpo.valor.forEach((entrada) => {
      if (entrada.tipo === "archivo") {
        formData.append(entrada.nombre, entrada.valor, entrada.nombreArchivo);
      } else {
        formData.append(entrada.nombre, entrada.valor);
      }
    });
    return formData;
  }
  if (cuerpo.tipo === "urlencoded") return new URLSearchParams(cuerpo.valor);
  return cuerpo.valor;
}

function contieneCampoSensible(valor) {
  if (valor instanceof FormData) {
    return Array.from(valor.keys()).some((nombre) =>
      /password|contrasena|contraseña|token|secret|clave/i.test(nombre),
    );
  }
  if (typeof valor === "string") {
    try {
      return contieneCampoSensible(JSON.parse(valor));
    } catch {
      return false;
    }
  }
  if (
    !valor ||
    typeof valor !== "object" ||
    valor instanceof Blob ||
    valor instanceof ArrayBuffer
  )
    return false;
  return Object.entries(valor).some(
    ([nombre, dato]) =>
      /password|contrasena|contraseña|token|secret|clave/i.test(nombre) ||
      contieneCampoSensible(dato),
  );
}

function extraerMensaje(error) {
  const data = error?.response?.data;
  return (
    data?.mensaje ||
    data?.message ||
    data?.error ||
    "El servidor rechazó el cambio."
  );
}

function nuevaTransaccion(modo) {
  return abrirBaseOffline().then((bd) => {
    if (!bd)
      throw new Error(
        "El almacenamiento local no está disponible en este navegador.",
      );
    return bd.transaction(ALMACEN_COLA, modo);
  });
}

export async function encolarOperacion(config, opciones = {}) {
  const idUsuario = obtenerIdUsuarioActual();
  if (!idUsuario)
    throw new Error("Inicia sesión para guardar cambios offline.");
  if (contieneCampoSensible(config.data)) {
    throw new Error(
      "Este cambio contiene datos de seguridad y requiere conexión.",
    );
  }

  const cuerpo = serializarCuerpo(config.data);
  if (cuerpo.bytes > MAX_BYTES_OPERACION) {
    throw new Error(
      "El cambio supera el tamaño máximo que se puede guardar offline.",
    );
  }

  const esFormulario = cuerpo.tipo === "formdata";
  const operacion = {
    id: crearId(),
    idUsuario: String(idUsuario),
    url: config.url,
    baseURL: config.baseURL,
    method: (config.method || "post").toUpperCase(),
    params: config.params || null,
    cuerpo,
    accept: leerHeader(config.headers, "Accept"),
    contentType: esFormulario
      ? null
      : leerHeader(config.headers, "Content-Type"),
    creada: Date.now(),
    estado: opciones.estado || "pendiente",
    intentos: 0,
    mensaje: opciones.mensaje || "",
  };

  const transaccion = await nuevaTransaccion("readwrite");
  await new Promise((resolve, reject) => {
    const almacen = transaccion.objectStore(ALMACEN_COLA);
    const solicitud = almacen.getAll();
    solicitud.onsuccess = () => {
      const delUsuario = solicitud.result.filter(
        (existente) => existente.idUsuario === String(idUsuario),
      );
      const bytesGuardados = delUsuario.reduce(
        (total, existente) => total + existente.cuerpo.bytes,
        0,
      );
      if (
        delUsuario.length >= MAX_OPERACIONES_COLA ||
        bytesGuardados + cuerpo.bytes > MAX_BYTES_COLA
      ) {
        reject(
          new Error(
            "La cola offline alcanzó su límite. Conéctate para sincronizarla.",
          ),
        );
        transaccion.abort();
        return;
      }
      almacen.add(operacion);
    };
    solicitud.onerror = () => reject(solicitud.error);
    transaccion.oncomplete = resolve;
    transaccion.onerror = () => reject(transaccion.error);
    transaccion.onabort = () =>
      reject(
        transaccion.error || new Error("No se pudo guardar el cambio offline."),
      );
  });
  notificarCola();
  return operacion;
}

export async function obtenerEstadoCola() {
  const idUsuario = obtenerIdUsuarioActual();
  if (!idUsuario)
    return { pendientes: 0, revision: 0, rechazadas: 0, operaciones: [] };

  try {
    const transaccion = await nuevaTransaccion("readonly");
    return await new Promise((resolve, reject) => {
      const solicitud = transaccion.objectStore(ALMACEN_COLA).getAll();
      solicitud.onsuccess = () => {
        const operaciones = solicitud.result
          .filter((operacion) => operacion.idUsuario === String(idUsuario))
          .sort((a, b) => a.creada - b.creada);
        resolve({
          pendientes: operaciones.filter((operacion) =>
            ["pendiente", "sincronizando"].includes(operacion.estado),
          ).length,
          revision: operaciones.filter(
            (operacion) => operacion.estado === "revision",
          ).length,
          rechazadas: operaciones.filter(
            (operacion) => operacion.estado === "rechazada",
          ).length,
          operaciones,
        });
      };
      solicitud.onerror = () => reject(solicitud.error);
    });
  } catch (error) {
    console.warn("No se pudo consultar la cola offline:", error);
    return { pendientes: 0, revision: 0, rechazadas: 0, operaciones: [] };
  }
}

export async function obtenerIngresoEnCola(idExamen, idEstudiante) {
  const estado = await obtenerEstadoCola();
  const rutaEsperada = `/ingresos/examenes/${idExamen}/ingresos`;

  return (
    estado.operaciones.find((operacion) => {
      if (
        operacion.method !== "POST" ||
        !operacion.url?.split("?")[0].endsWith(rutaEsperada)
      ) {
        return false;
      }

      let cuerpo = operacion.cuerpo?.valor;
      if (operacion.cuerpo?.tipo === "texto" && typeof cuerpo === "string") {
        try {
          cuerpo = JSON.parse(cuerpo);
        } catch {
          return false;
        }
      }

      return String(cuerpo?.idEstudiante) === String(idEstudiante);
    }) || null
  );
}

async function actualizarOperacion(id, cambios) {
  const transaccion = await nuevaTransaccion("readwrite");
  const almacen = transaccion.objectStore(ALMACEN_COLA);
  const solicitud = almacen.get(id);
  solicitud.onsuccess = () => {
    if (solicitud.result) almacen.put({ ...solicitud.result, ...cambios });
  };
  await new Promise((resolve, reject) => {
    transaccion.oncomplete = resolve;
    transaccion.onerror = () => reject(transaccion.error);
    transaccion.onabort = () => reject(transaccion.error);
  });
  notificarCola();
}

async function reclamarSiguiente(idUsuario) {
  const transaccion = await nuevaTransaccion("readwrite");
  const almacen = transaccion.objectStore(ALMACEN_COLA);
  let reclamada = null;
  const solicitud = almacen.getAll();
  solicitud.onsuccess = () => {
    const siguiente = solicitud.result
      .filter(
        (operacion) =>
          operacion.idUsuario === String(idUsuario) &&
          operacion.estado === "pendiente",
      )
      .sort((a, b) => a.creada - b.creada)[0];
    if (!siguiente) return;
    reclamada = {
      ...siguiente,
      estado: "sincronizando",
      intentos: siguiente.intentos + 1,
      ultimoIntento: Date.now(),
    };
    almacen.put(reclamada);
  };
  await new Promise((resolve, reject) => {
    transaccion.oncomplete = resolve;
    transaccion.onerror = () => reject(transaccion.error);
    transaccion.onabort = () => reject(transaccion.error);
  });
  if (reclamada) notificarCola();
  return reclamada;
}

async function recuperarEnviosInterrumpidos(idUsuario) {
  const estado = await obtenerEstadoCola();
  const limite = Date.now() - 60_000;
  for (const operacion of estado.operaciones) {
    if (
      operacion.idUsuario === String(idUsuario) &&
      operacion.estado === "sincronizando" &&
      operacion.ultimoIntento < limite
    ) {
      await actualizarOperacion(operacion.id, {
        estado: "revision",
        mensaje:
          "No se confirmó la respuesta del servidor. Revisa el resultado antes de reintentar.",
      });
    }
  }
}

async function eliminarOperacion(id) {
  const transaccion = await nuevaTransaccion("readwrite");
  transaccion.objectStore(ALMACEN_COLA).delete(id);
  await new Promise((resolve, reject) => {
    transaccion.oncomplete = resolve;
    transaccion.onerror = () => reject(transaccion.error);
    transaccion.onabort = () => reject(transaccion.error);
  });
  notificarCola();
}

export async function sincronizarCola(api) {
  if (sincronizacionActiva || !navigator.onLine) return;
  const idUsuario = obtenerIdUsuarioActual();
  if (!idUsuario) return;

  sincronizacionActiva = true;
  try {
    await recuperarEnviosInterrumpidos(idUsuario);
    while (navigator.onLine) {
      const operacion = await reclamarSiguiente(idUsuario);
      if (!operacion) break;
      if (!navigator.onLine) {
        await actualizarOperacion(operacion.id, {
          estado: "pendiente",
          ultimoIntento: 0,
        });
        break;
      }

      try {
        await api.request({
          url: operacion.url,
          baseURL: operacion.baseURL,
          method: operacion.method,
          params: operacion.params,
          data: restaurarCuerpo(operacion.cuerpo),
          headers: {
            ...(operacion.accept ? { Accept: operacion.accept } : {}),
            ...(operacion.contentType
              ? { "Content-Type": operacion.contentType }
              : {}),
          },
          timeout: 30_000,
          offlineReplay: true,
        });
        await eliminarOperacion(operacion.id);
        window.dispatchEvent(new Event("exampass:offline-sync-complete"));
      } catch (error) {
        const status = error.response?.status;
        const rechazada =
          status >= 400 &&
          status < 500 &&
          ![401, 403, 408, 429].includes(status);
        await actualizarOperacion(operacion.id, {
          estado: rechazada ? "rechazada" : "revision",
          mensaje: extraerMensaje(error),
        });
        break;
      }
    }
  } catch (error) {
    console.warn("No se pudo sincronizar la cola offline:", error);
  } finally {
    sincronizacionActiva = false;
    notificarCola();
    const estado = await obtenerEstadoCola();
    if (
      estado.operaciones.some(
        (operacion) => operacion.estado === "sincronizando",
      )
    ) {
      setTimeout(() => void sincronizarCola(api), 65_000);
    }
  }
}

export async function reintentarOperacion(id, api) {
  await actualizarOperacion(id, { estado: "pendiente", mensaje: "" });
  await sincronizarCola(api);
}

export async function descartarOperacion(id, api) {
  await eliminarOperacion(id);
  if (api && navigator.onLine) await sincronizarCola(api);
}
