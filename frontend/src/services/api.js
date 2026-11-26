import axios from "axios";
import {
  guardarRespuestaGet,
  obtenerRespuestaGet,
  limpiarCacheOffline,
} from "../offline/cacheApi.js";
import { encolarOperacion, sincronizarCola } from "../offline/outbox.js";

const CLAVE_SESION = "exampass_sesion";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

function tokenActual() {
  try {
    const sesion = JSON.parse(sessionStorage.getItem(CLAVE_SESION) || "null");
    if (sesion?.token) return sesion.token;
  } catch (error) {
    console.warn("Sesión de pestaña inválida:", error);
    sessionStorage.removeItem(CLAVE_SESION);
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("usuario");
  }
  return sessionStorage.getItem("token");
}

function normalizarErrorHtml(error) {
  const contenido = error.response?.data;
  if (typeof contenido !== "string") return;

  const pareceHtml =
    /<\s*!doctype\s+html|<\s*html[\s>]|<\s*body[\s>]|<\s*h1[^>]*>\s*\d{3}\s+/i.test(
      contenido,
    );
  if (!pareceHtml) return;

  const status = error.response.status;
  let mensaje =
    "El servidor no pudo completar la solicitud. Intenta nuevamente.";
  if (status === 502 || status === 503 || status === 504) {
    mensaje =
      "El servicio no está disponible en este momento. Intenta nuevamente en unos minutos.";
  }
  error.response.data = { mensaje };
}

function limpiarSesionLocal() {
  void limpiarCacheOffline();
  sessionStorage.removeItem("usuario");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("ultimaActividad");
  sessionStorage.removeItem(CLAVE_SESION);
  if (typeof BroadcastChannel !== "undefined") {
    const canal = new BroadcastChannel("exampass_sesion");
    canal.postMessage({ tipo: "CERRAR_SESION" });
    canal.close();
  }
}

function esEndpointPublico(config) {
  const ruta = (config?.url || "").split("?")[0];
  return /^\/?(?:api\/)?auth\/(?:login|recuperacion\/.*)$/.test(ruta);
}

function esEndpointSensible(config) {
  const ruta = config?.url || "";
  return (
    /(?:^|\/)auth\//i.test(ruta) ||
    /(?:^|\/)(?:contrasena|password)(?:\/|$)/i.test(ruta)
  );
}

function esValidacionConEfectos(config) {
  return /\/habilitacion\/verificar-ingreso(?:\?|$)/i.test(config?.url || "");
}

api.interceptors.request.use(async (config) => {
  if (esEndpointPublico(config)) {
    delete config.headers.Authorization;
    return config;
  }
  const token = tokenActual();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const metodo = (config.method || "get").toLowerCase();
  if (
    token &&
    metodo !== "get" &&
    !config.offlineReplay &&
    !navigator.onLine &&
    !esEndpointSensible(config) &&
    !esValidacionConEfectos(config)
  ) {
    await encolarOperacion(config);
    window.dispatchEvent(
      new CustomEvent("exampass:offline-operation-queued", {
        detail: { method: metodo.toUpperCase(), url: config.url },
      }),
    );
    const error = new Error(
      "El cambio quedó guardado en este dispositivo para sincronizarse.",
    );
    error.code = "ERR_OFFLINE_QUEUED";
    error.isOfflineQueued = true;
    error.config = config;
    error.response = {
      status: 202,
      data: {
        mensaje:
          "Cambio guardado en este dispositivo; pendiente de sincronización.",
        message:
          "Cambio guardado en este dispositivo; pendiente de sincronización.",
        isOfflineQueued: true,
      },
      config,
    };
    throw error;
  }

  return config;
});

api.interceptors.response.use(
  async (response) => {
    await guardarRespuestaGet(response);
    window.dispatchEvent(new Event("exampass:online-response"));
    return response;
  },
  async (error) => {
    normalizarErrorHtml(error);
    if (
      !error.response &&
      error.config &&
      (error.config.method || "get").toLowerCase() !== "get" &&
      !error.config.offlineReplay &&
      tokenActual() &&
      !esEndpointSensible(error.config) &&
      !esValidacionConEfectos(error.config)
    ) {
      try {
        await encolarOperacion(error.config, {
          estado: "revision",
          mensaje:
            "No se confirmó si el servidor aplicó este cambio. Verifica antes de reintentarlo.",
        });
        window.dispatchEvent(
          new CustomEvent("exampass:offline-operation-review", {
            detail: {
              method: error.config.method?.toUpperCase(),
              url: error.config.url,
            },
          }),
        );
      } catch (errorCola) {
        console.warn("No se pudo guardar el cambio para revisión:", errorCola);
      }
    }

    const respuestaServidorNoDisponible =
      error.response?.status >= 500 && error.response?.status <= 599;
    if (
      error.config &&
      (error.config.method || "get").toLowerCase() === "get" &&
      (!error.response || respuestaServidorNoDisponible)
    ) {
      window.dispatchEvent(new Event("exampass:offline-cache"));
      const respuestaLocal = await obtenerRespuestaGet(error.config);
      if (respuestaLocal) {
        return respuestaLocal;
      }
      if (!navigator.onLine) {
        error.code = "ERR_OFFLINE_CACHE_MISS";
        error.response = {
          status: 503,
          data: {
            mensaje:
              "No hay datos guardados para esta consulta en este dispositivo. Conéctate y vuelve a cargarla.",
          },
          config: error.config,
        };
      }
    }

    if (error.response?.status !== 401 || esEndpointPublico(error.config)) {
      return Promise.reject(error);
    }

    const encabezado =
      error.config?.headers?.get?.("Authorization") ||
      error.config?.headers?.Authorization ||
      "";
    const tokenPeticion = String(encabezado).replace(/^Bearer\s+/i, "");
    const vigente = tokenActual();
    if (!tokenPeticion || tokenPeticion !== vigente) {
      return Promise.reject(error);
    }

    const rutaActual =
      window.location.pathname + window.location.search + window.location.hash;
    if (window.location.pathname === "/inscripcion-qr/inscribir") {
      sessionStorage.setItem("hu12_ruta_pendiente", rutaActual);
    }

    limpiarSesionLocal();

    if (window.location.pathname !== "/login") {
      window.location.replace("/login");
    }
    return Promise.reject(error);
  },
);

export default api;

if (typeof window !== "undefined") {
  const sincronizarPendientes = () => void sincronizarCola(api);
  window.addEventListener("online", sincronizarPendientes);
  window.addEventListener("exampass:session-ready", sincronizarPendientes);
  window.addEventListener("load", sincronizarPendientes, { once: true });
  if (document.readyState === "complete") sincronizarPendientes();
}
