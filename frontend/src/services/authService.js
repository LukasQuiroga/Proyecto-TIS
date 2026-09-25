import axios from "axios";

const API_AUTH = "http://localhost:8080/api/auth";

export async function login(correo, password) {
  const respuesta = await axios.post(`${API_AUTH}/login`, {
    correo,
    password,
  });

  return respuesta.data;
}

export function logout() {
  localStorage.removeItem("usuario");

  sessionStorage.removeItem("usuario");
}
