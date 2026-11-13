import axios from "axios";

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

api.interceptors.request.use((config) => {
  if (esEndpointPublico(config)) {
    delete config.headers.Authorization;
    return config;
  }
  const token = tokenActual();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    normalizarErrorHtml(error);
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
