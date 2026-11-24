const NOMBRE_BD = "exampass-offline";
const VERSION_BD = 1;
const ALMACEN = "respuestas-get";
const MAX_RESPUESTAS_CACHEADAS = 200;
const MAX_BYTES_RESPUESTA = 2_000_000;
let aperturaBd;

function idUsuarioActual() {
  try {
    const sesion = JSON.parse(
      sessionStorage.getItem("exampass_sesion") || "null",
    );
    return sesion?.usuario?.idUsuario || null;
  } catch {
    return null;
  }
}

function abrirBd() {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  if (aperturaBd) return aperturaBd;

  aperturaBd = new Promise((resolve, reject) => {
    const solicitud = indexedDB.open(NOMBRE_BD, VERSION_BD);

    solicitud.onupgradeneeded = () => {
      const bd = solicitud.result;
      if (!bd.objectStoreNames.contains(ALMACEN)) {
        bd.createObjectStore(ALMACEN, { keyPath: "clave" });
      }
    };
    solicitud.onsuccess = () => resolve(solicitud.result);
    solicitud.onerror = () => reject(solicitud.error);
    solicitud.onblocked = () =>
      reject(new Error("La base local está bloqueada."));
  }).catch((error) => {
    aperturaBd = null;
    throw error;
  });

  return aperturaBd;
}

function serializarParametros(parametros) {
  if (!parametros) return "";

  return Object.keys(parametros)
    .sort()
    .map(
      (nombre) =>
        `${encodeURIComponent(nombre)}=${encodeURIComponent(String(parametros[nombre]))}`,
    )
    .join("&");
}

function crearClave(config, idUsuario) {
  const metodo = (config.method || "get").toUpperCase();
  const base = new URL(config.baseURL || "/", window.location.origin);
  const ruta = (config.url || "").replace(/^\/+/, "");
  const prefijo = base.pathname.replace(/\/+$/, "");
  const url = new URL(`${prefijo}/${ruta}`, base.origin);
  const parametros = serializarParametros(config.params);
  const consulta = [url.searchParams.toString(), parametros]
    .filter(Boolean)
    .join("&");
  return `${idUsuario}|${metodo}|${url.pathname}${consulta ? `?${consulta}` : ""}`;
}

export async function guardarRespuestaGet(response) {
  const config = response.config;
  const idUsuario = idUsuarioActual();
  if (
    !idUsuario ||
    (config.method || "get").toLowerCase() !== "get" ||
    !response.status ||
    response.status < 200 ||
    response.status >= 300 ||
    config.responseType === "blob" ||
    config.responseType === "arraybuffer"
  ) {
    return;
  }

  try {
    if (JSON.stringify(response.data).length > MAX_BYTES_RESPUESTA) return;

    const bd = await abrirBd();
    if (!bd) return;
    const transaccion = bd.transaction(ALMACEN, "readwrite");
    const almacen = transaccion.objectStore(ALMACEN);
    almacen.put({
      clave: crearClave(config, idUsuario),
      idUsuario: String(idUsuario),
      data: response.data,
      status: response.status,
      actualizado: Date.now(),
    });
    const conteo = almacen.count();
    conteo.onsuccess = () => {
      if (conteo.result <= MAX_RESPUESTAS_CACHEADAS) return;

      const todas = almacen.getAll();
      todas.onsuccess = () => {
        const antiguas = todas.result
          .sort((a, b) => a.actualizado - b.actualizado)
          .slice(0, conteo.result - MAX_RESPUESTAS_CACHEADAS);
        antiguas.forEach((registro) => almacen.delete(registro.clave));
      };
    };
  } catch (error) {
    console.warn("No se pudo guardar la consulta para uso offline:", error);
  }
}

export async function obtenerRespuestaGet(config) {
  const idUsuario = idUsuarioActual();
  if (!idUsuario || (config.method || "get").toLowerCase() !== "get")
    return null;

  try {
    const bd = await abrirBd();
    if (!bd) return null;

    return await new Promise((resolve, reject) => {
      const transaccion = bd.transaction(ALMACEN, "readonly");
      const solicitud = transaccion
        .objectStore(ALMACEN)
        .get(crearClave(config, idUsuario));
      solicitud.onsuccess = () => {
        const registro = solicitud.result;
        if (!registro || registro.idUsuario !== String(idUsuario)) {
          resolve(null);
          return;
        }

        resolve({
          data: registro.data,
          status: registro.status,
          statusText: "Respuesta local offline",
          headers: {},
          config,
          request: null,
          desdeCacheOffline: true,
          cacheActualizada: registro.actualizado,
        });
      };
      solicitud.onerror = () => reject(solicitud.error);
    });
  } catch (error) {
    console.warn("No se pudo leer la consulta guardada offline:", error);
    return null;
  }
}

export async function limpiarCacheOffline() {
  try {
    const bd = await abrirBd();
    if (!bd) return;

    await new Promise((resolve, reject) => {
      const transaccion = bd.transaction(ALMACEN, "readwrite");
      transaccion.objectStore(ALMACEN).clear();
      transaccion.oncomplete = resolve;
      transaccion.onerror = () => reject(transaccion.error);
      transaccion.onabort = () => reject(transaccion.error);
    });
  } catch (error) {
    console.warn("No se pudo limpiar la caché local:", error);
  }
}
