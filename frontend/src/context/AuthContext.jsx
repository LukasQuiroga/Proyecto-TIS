import { useCallback, useEffect, useState } from "react";
import { AuthContext } from "./authContext";
import { obtenerPermisosActuales } from "../services/authService";

const CLAVE_SESION = "exampass_sesion";

function leerSesionCompartida() {
  try {
    const valor = localStorage.getItem(CLAVE_SESION);
    if (valor) {
      const datos = JSON.parse(valor);
      if (datos?.token && datos?.usuario?.idUsuario) return datos;
    }
  } catch {
  }
  return null;
}

function leerSesionInicial() {
  const compartida = leerSesionCompartida();
  if (compartida) return compartida;

  for (const almacen of [localStorage, sessionStorage]) {
    try {
      const token = almacen.getItem("token");
      const dato = almacen.getItem("usuario");
      const usuario = dato ? JSON.parse(dato) : null;
      if (token && usuario?.idUsuario) {
        const sesion = { usuario, token };
        localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
        localStorage.setItem("token", token);
        localStorage.setItem("usuario", JSON.stringify(usuario));
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("usuario");
        return sesion;
      }
    } catch {
      almacen.removeItem("token");
      almacen.removeItem("usuario");
    }
  }
  return { usuario: null, token: null };
}

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(leerSesionInicial);
  const [permisosActualizados, setPermisosActualizados] = useState(false);
  const { usuario, token } = sesion;

  const iniciarSesion = useCallback((datosUsuario, tokenJwt, recordar = false) => {
    const siguiente = { usuario: datosUsuario, token: tokenJwt };
    sessionStorage.removeItem("usuario");
    sessionStorage.removeItem("token");

    localStorage.setItem("usuario", JSON.stringify(datosUsuario));
    localStorage.setItem("token", tokenJwt);
    localStorage.setItem(CLAVE_SESION, JSON.stringify(siguiente));
    localStorage.setItem("ultimaActividad", Date.now().toString());
    setSesion(siguiente);
    setPermisosActualizados(false);
    void recordar;
  }, []);

  const cerrarSesion = useCallback(() => {
    localStorage.removeItem("usuario");
    localStorage.removeItem("token");
    sessionStorage.removeItem("usuario");
    sessionStorage.removeItem("token");
    localStorage.removeItem("ultimaActividad");
    localStorage.removeItem(CLAVE_SESION);
    setSesion({ usuario: null, token: null });
    setPermisosActualizados(false);
  }, []);

  useEffect(() => {
    function sincronizar(evento) {
      if (evento.storageArea !== localStorage ||
          (evento.key !== CLAVE_SESION && evento.key !== null)) return;

      const nueva = leerSesionCompartida() || { usuario: null, token: null };
      setSesion((anterior) => {
        if (anterior.token === nueva.token &&
            anterior.usuario?.idUsuario === nueva.usuario?.idUsuario) return anterior;
        return nueva;
      });
      setPermisosActualizados(false);

      if (window.location.pathname !== "/" &&
          window.location.pathname !== "/login") {
        window.location.replace("/");
      }
    }
    window.addEventListener("storage", sincronizar);
    return () => window.removeEventListener("storage", sincronizar);
  }, []);

  useEffect(() => {
    if (!usuario?.idUsuario || !token) return undefined;
    let vigente = true;

    async function verificarPermisos() {
      try {
        const actuales = await obtenerPermisosActuales(usuario.idUsuario);
        if (!vigente) return;
        const previos = usuario.permisos || [];
        const cambiaron = JSON.stringify([...actuales].sort()) !==
          JSON.stringify([...previos].sort());
        if (cambiaron) setPermisosActualizados(true);
      } catch (error) {
        if (vigente) console.error("Error verificando permisos:", error);
      }
    }

    verificarPermisos();
    const intervalo = setInterval(verificarPermisos, 30000);
    return () => {
      vigente = false;
      clearInterval(intervalo);
    };
  }, [usuario, token]);

  return (
    <AuthContext.Provider value={{
      usuario, token, cargando: false, iniciarSesion, cerrarSesion,
      permisosActualizados, setPermisosActualizados
    }}>
      {children}
    </AuthContext.Provider>
  );
}
