import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const rutaActual =
        window.location.pathname +
        window.location.search +
        window.location.hash;

      const esLogin = window.location.pathname === "/login";

      localStorage.removeItem("usuario");
      localStorage.removeItem("token");
      localStorage.removeItem("ultimaActividad");

      sessionStorage.removeItem("usuario");
      sessionStorage.removeItem("token");

      if (!esLogin) {
        const destino = new URL(
          "/login",
          window.location.origin
        );

        if (
          window.location.pathname ===
          "/inscripcion-qr/inscribir"
        ) {
          sessionStorage.setItem(
            "hu12_ruta_pendiente",
            rutaActual
          );
        }

        window.location.replace(destino.pathname);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
