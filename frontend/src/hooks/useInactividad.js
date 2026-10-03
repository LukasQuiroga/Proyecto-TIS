import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { cerrarSesionBackend } from "../services/authService";

const TIEMPO_INACTIVIDAD = 20000;

function useInactividad() {
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!usuario) {
      return;
    }

    let temporizador = null;
    let intervalo = null;

    const finalizarSesion = async () => {
      try {
        await cerrarSesionBackend();
      } catch {
        // La sesión local igualmente se cerrará.
      }

      cerrarSesion();

      navigate("/login", { replace: true });
    };

    const comprobarInactividad = () => {
      const ultimaActividad = Number(localStorage.getItem("ultimaActividad"));

      if (!ultimaActividad) {
        localStorage.setItem("ultimaActividad", Date.now().toString());

        return;
      }

      const tiempoTranscurrido = Date.now() - ultimaActividad;

      if (tiempoTranscurrido >= TIEMPO_INACTIVIDAD) {
        finalizarSesion();
      }
    };

    const registrarActividad = () => {
      localStorage.setItem("ultimaActividad", Date.now().toString());

      clearTimeout(temporizador);

      temporizador = setTimeout(finalizarSesion, TIEMPO_INACTIVIDAD);
    };

    const eventos = ["mousedown", "keydown", "scroll", "touchstart"];

    eventos.forEach((evento) =>
      window.addEventListener(evento, registrarActividad),
    );

    registrarActividad();

    intervalo = setInterval(comprobarInactividad, 1000);

    return () => {
      clearTimeout(temporizador);
      clearInterval(intervalo);

      eventos.forEach((evento) =>
        window.removeEventListener(evento, registrarActividad),
      );
    };
  }, [usuario, cerrarSesion, navigate]);
}

export default useInactividad;
