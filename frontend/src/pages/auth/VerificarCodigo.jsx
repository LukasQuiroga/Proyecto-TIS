import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  verificarCodigoRecuperacion
} from "../../services/authService";

import "./RecuperacionContrasena.css";

function VerificarCodigo() {

  const navigate = useNavigate();

  const [codigo, setCodigo] =
    useState("");

  const [error, setError] =
    useState("");

  const verificar = async (e) => {

    e.preventDefault();

    setError("");

    const correo =
      localStorage.getItem(
        "correoRecuperacion"
      );

    if (!correo) {

      setError(
        "Debes solicitar un código de recuperación primero"
      );

      return;
    }

    if (!/^\d{6}$/.test(codigo)) {

      setError(
        "El código debe contener exactamente 6 números"
      );

      return;
    }

    try {

      const respuesta =
        await verificarCodigoRecuperacion(
          correo,
          codigo
        );

      localStorage.setItem(
        "tokenRecuperacion",
        respuesta.token
      );

      navigate(
        "/nueva-contrasena"
      );

    } catch {

      setError(
        "Código incorrecto o expirado"
      );
    }
  };

  const cambiarCodigo = (e) => {

    const soloNumeros =
      e.target.value
        .replace(/\D/g, "")
        .slice(0, 6);

    setCodigo(soloNumeros);

    setError("");
  };

  return (

    <div className="recuperacion-page">

      <div className="recuperacion-card">

        <h2>
          Verificar código
        </h2>

        <p>
          Ingresa el código enviado a tu correo.
        </p>

        <form onSubmit={verificar}>

          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="000000"
            value={codigo}
            onChange={cambiarCodigo}
            autoComplete="one-time-code"
          />

          {error && (
            <p className="error">
              {error}
            </p>
          )}

          <button type="submit">
            Verificar
          </button>

        </form>

        <button
          type="button"
          className="volver"
          onClick={() =>
            navigate(
              "/recuperar-contrasena"
            )
          }
        >
          Volver
        </button>

      </div>

    </div>
  );
}

export default VerificarCodigo;