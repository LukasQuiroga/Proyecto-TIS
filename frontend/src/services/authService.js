import axios from "axios";
import api from "./api";

const API_AUTH = "http://localhost:8080/api/auth";

export async function login(correo, password) {
  const respuesta = await axios.post(
    `${API_AUTH}/login`,
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
  const respuesta = await axios.post(`${API_AUTH}/recuperacion/solicitar`, {
    correo,
  });

  return respuesta.data;
}

export async function verificarCodigoRecuperacion(correo, codigo) {
  const respuesta = await axios.post(
    `${API_AUTH}/recuperacion/verificar-codigo`,
    {
      correo,
      codigo,
    },
  );

  return respuesta.data;
}

export async function restablecerContrasena({
  correo,
  token,
  nuevaContrasena,
  confirmarContrasena,
}) {
  const respuesta = await axios.post(`${API_AUTH}/recuperacion/restablecer`, {
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
