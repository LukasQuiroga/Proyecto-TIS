import api from "./api";

export async function login(correo, password) {
  const respuesta = await api.post(
    "/auth/login",
    {
      correo,
      password,
    },
    {
      timeout: 10000,
    },
  );

  return respuesta.data;
}

export async function cerrarSesionBackend() {
  return api.post("/auth/logout");
}

export async function solicitarRecuperacion(correo) {
  const respuesta = await api.post("/auth/recuperacion/solicitar", {
    correo,
  });

  return respuesta.data;
}

export async function verificarCodigoRecuperacion(correo, codigo) {
  const respuesta = await api.post("/auth/recuperacion/verificar-codigo", {
    correo,
    codigo,
  });

  return respuesta.data;
}

export async function restablecerContrasena({
  correo,
  token,
  nuevaContrasena,
  confirmarContrasena,
}) {
  const respuesta = await api.post("/auth/recuperacion/restablecer", {
    correo,
    token,
    nuevaContrasena,
    confirmarContrasena,
  });

  return respuesta.data;
}

export async function obtenerPermisosActuales(idUsuario) {
  const respuesta = await api.get(`/auth/${idUsuario}/permisos`);

  return respuesta.data;
}
