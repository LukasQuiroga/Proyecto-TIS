import axios from "axios";

const CLAVE_SESION = "exampass_sesion";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

function tokenActual() {
  try {
    const sesion = JSON.parse(localStorage.getItem(CLAVE_SESION) || "null");
    if (sesion?.token) return sesion.token;
  } catch (error) {
    console.warn("Sesión compartida inválida:", error);
    localStorage.removeItem(CLAVE_SESION);
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
  }
  return localStorage.getItem("token") || sessionStorage.getItem("token");
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

    localStorage.removeItem("usuario");
    localStorage.removeItem("token");
    sessionStorage.removeItem("usuario");
    sessionStorage.removeItem("token");
    localStorage.removeItem("ultimaActividad");
    localStorage.removeItem(CLAVE_SESION);

    if (window.location.pathname !== "/login") {
      window.location.replace("/login");
    }
    return Promise.reject(error);
  },
);

export default api;
