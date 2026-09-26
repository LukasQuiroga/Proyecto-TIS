import axios from "axios";

const API_AUTH = "http://localhost:8080/api/auth";

export async function login(correo, password) {
  const respuesta = await axios.post(`${API_AUTH}/login`, {
    correo,
    password,
  });

  return respuesta.data;
}

export async function solicitarRecuperacion(correo) {
  const respuesta = await axios.post(
    `${API_AUTH}/recuperacion/solicitar`,
    {
      correo,
    },
  );

  return respuesta.data;
}

export async function verificarCodigoRecuperacion(
  correo,
  codigo,
) {
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
  const respuesta = await axios.post(
    `${API_AUTH}/recuperacion/restablecer`,
    {
      correo,
      token,
      nuevaContrasena,
      confirmarContrasena,
    },
  );

  return respuesta.data;
}

export function logout() {
  localStorage.removeItem("usuario");
  sessionStorage.removeItem("usuario");
}