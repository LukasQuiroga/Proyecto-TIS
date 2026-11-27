const NOMBRE_BD = "exampass-offline";
const VERSION_BD = 2;
const ALMACEN = "respuestas-get";
export const ALMACEN_COLA = "cola-operaciones";
const MAX_RESPUESTAS_CACHEADAS = 10_000;
const MAX_BYTES_RESPUESTA = 10_000_000;
const MAX_BYTES_CACHE = 250_000_000;
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
      if (!bd.objectStoreNames.contains(ALMACEN_COLA)) {
        bd.createObjectStore(ALMACEN_COLA, { keyPath: "id" });
      }
    };
    solicitud.onsuccess = () => {
      const bd = solicitud.result;
      bd.onversionchange = () => {
        bd.close();
        aperturaBd = null;
      };
      resolve(bd);
    };
    solicitud.onerror = () => reject(solicitud.error);
    solicitud.onblocked = () =>
      reject(new Error("La base local está bloqueada."));
  }).catch((error) => {
    aperturaBd = null;
    throw error;
  });

  return aperturaBd;
}

export {
  abrirBd as abrirBaseOffline,
  idUsuarioActual as obtenerIdUsuarioActual,
};

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

function contieneCampoSensible(valor) {
  if (!valor || typeof valor !== "object") return false;
  return Object.entries(valor).some(
    ([nombre, dato]) =>
      /password|contrasena|contraseña|token|secret|clave/i.test(nombre) ||
      contieneCampoSensible(dato),
  );
}

function bytesRespuesta(data) {
  if (data instanceof Blob) return data.size;
  if (data instanceof ArrayBuffer) return data.byteLength;
  if (ArrayBuffer.isView(data)) return data.byteLength;

  const serializado = JSON.stringify(data);
  return serializado ? new TextEncoder().encode(serializado).byteLength : 0;
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
    contieneCampoSensible(response.data)
  ) {
    return;
  }

  try {
    const bytes = bytesRespuesta(response.data);
    if (!bytes) return;
    if (bytes > MAX_BYTES_RESPUESTA) return;

    const bd = await abrirBd();
    if (!bd) return;
    let resolveGuardado;
    let rejectGuardado;
    const guardado = new Promise((resolve, reject) => {
      resolveGuardado = resolve;
      rejectGuardado = reject;
    });
    const transaccion = bd.transaction(ALMACEN, "readwrite");
    const almacen = transaccion.objectStore(ALMACEN);
    transaccion.oncomplete = resolveGuardado;
    transaccion.onerror = () => rejectGuardado(transaccion.error);
    transaccion.onabort = () => rejectGuardado(transaccion.error);
    almacen.put({
      clave: crearClave(config, idUsuario),
      idUsuario: String(idUsuario),
      data: response.data,
      status: response.status,
      actualizado: Date.now(),
      bytes,
    });
    const todas = almacen.getAll();
    todas.onsuccess = () => {
      const registros = todas.result.sort(
        (a, b) => a.actualizado - b.actualizado,
      );
      let totalBytes = registros.reduce((total, registro) => {
        const bytesRegistro = registro.bytes ?? bytesRespuesta(registro.data);
        return total + bytesRegistro;
      }, 0);

      while (
        registros.length > MAX_RESPUESTAS_CACHEADAS ||
        totalBytes > MAX_BYTES_CACHE
      ) {
        const antiguo = registros.shift();
        if (!antiguo) break;
        totalBytes -= antiguo.bytes ?? bytesRespuesta(antiguo.data);
        almacen.delete(antiguo.clave);
      }
    };
    todas.onerror = () => {
      try {
        transaccion.abort();
      } catch {
        rejectGuardado(todas.error);
      }
    };
    await guardado;
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
          cacheBytes: registro.bytes,
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
