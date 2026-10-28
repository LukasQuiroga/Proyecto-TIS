import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { cerrarSesionBackend } from "../services/authService";

const TIEMPO_INACTIVIDAD = 600000;

function useInactividad() {
  const { usuario, token, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!usuario?.idUsuario || !token) return undefined;
    let activo = true;
    let cerrando = false;
    let ultimoEvento = 0;

    async function finalizarSesion() {
      if (cerrando || !activo) return;
      cerrando = true;
      const sesion = JSON.parse(
        localStorage.getItem("exampass_sesion") || "null",
      );
      if (sesion?.token !== token) return;
      try {
        await cerrarSesionBackend();
      } catch {}
      if (!activo) return;
      const actual = JSON.parse(
        localStorage.getItem("exampass_sesion") || "null",
      );
      if (actual?.token !== token) return;
      cerrarSesion();
      navigate("/login", { replace: true });
    }

    function comprobarInactividad() {
      const ultima = Number(localStorage.getItem("ultimaActividad"));
      if (!ultima) {
        localStorage.setItem("ultimaActividad", Date.now().toString());
        return;
      }
      if (Date.now() - ultima >= TIEMPO_INACTIVIDAD) {
        void finalizarSesion();
      }
    }

    function registrarActividad() {
      if (Date.now() - ultimoEvento < 1000) return;
      ultimoEvento = Date.now();
      localStorage.setItem("ultimaActividad", ultimoEvento.toString());
    }

    const eventos = ["mousedown", "keydown", "scroll", "touchstart"];
    eventos.forEach((evento) =>
      window.addEventListener(evento, registrarActividad),
    );
    comprobarInactividad();
    const intervalo = setInterval(comprobarInactividad, 1000);

    return () => {
      activo = false;
      clearInterval(intervalo);
      eventos.forEach((evento) =>
        window.removeEventListener(evento, registrarActividad),
      );
    };
  }, [usuario?.idUsuario, token, cerrarSesion, navigate]);
}

export default useInactividad;
