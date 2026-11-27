import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { FaEye, FaEyeSlash } from "react-icons/fa";

import "./ModalInicioSesion.css";
import { login } from "../../services/authService";
import { useAuth } from "../../context/useAuth";

const CLAVE_RUTA_PENDIENTE = "hu12_ruta_pendiente";
const SELECTOR_FOQUEABLE = [
    "button:not([disabled])",
    "input:not([disabled])",
    "a[href]",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])'
].join(",");

function obtenerRutaQrPendiente() {
    const rutaGuardada = sessionStorage.getItem(
        CLAVE_RUTA_PENDIENTE
    );

    if (!rutaGuardada) {
        return null;
    }

    try {
        const url = new URL(
            rutaGuardada,
            window.location.origin
        );

        if (
            url.origin !== window.location.origin ||
            url.pathname !== "/inscripcion-qr/inscribir" ||
            !url.searchParams.get("token")?.trim()
        ) {
            sessionStorage.removeItem(CLAVE_RUTA_PENDIENTE);
            return null;
        }

        return {
            pathname: url.pathname,
            search: url.search,
            hash: url.hash
        };
    } catch {
        sessionStorage.removeItem(CLAVE_RUTA_PENDIENTE);
        return null;
    }
}

function obtenerDestino(state) {
    const desde = state?.from;

    if (
        typeof desde?.pathname === "string" &&
        desde.pathname.startsWith("/") &&
        !desde.pathname.startsWith("//")
    ) {
        const parametros = new URLSearchParams(desde.search || "");

        parametros.delete("iniciar-sesion");

        const busqueda = parametros.toString();

        return {
            pathname: desde.pathname,
            search: busqueda ? `?${busqueda}` : "",
            hash: desde.hash || ""
        };
    }

    return obtenerRutaQrPendiente() || "/";
}

function ModalInicioSesion({ abierto, onCerrar }) {
    const navigate = useNavigate();
    const location = useLocation();

    const {
        iniciarSesion
    } = useAuth();

    const [correo, setCorreo] = useState("");
    const [password, setPassword] = useState("");
    const [mostrar, setMostrar] = useState(false);
    const [cargando, setCargando] = useState(false);

    const [estado, setEstado] = useState({
        mostrar: false,
        tipo: ""
    });

    const temporizador = useRef(null);
    const dialogo = useRef(null);
    const entradaCorreo = useRef(null);
    const cargandoRef = useRef(false);

    const destino = obtenerDestino(location.state);

    const reiniciar = useCallback(() => {
        if (temporizador.current !== null) {
            clearTimeout(temporizador.current);
            temporizador.current = null;
        }

        setCorreo("");
        setPassword("");
        setMostrar(false);
        setCargando(false);
        setEstado({
            mostrar: false,
            tipo: ""
        });
    }, []);

    const cerrar = useCallback(() => {
        if (cargandoRef.current) {
            return;
        }

        reiniciar();
        onCerrar();
    }, [onCerrar, reiniciar]);

    useEffect(() => {
        return () => {
            if (temporizador.current !== null) {
                clearTimeout(temporizador.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!abierto) {
            return undefined;
        }

        const elementoAnterior = document.activeElement;
        const desbordamientoAnterior = document.body.style.overflow;

        document.body.style.overflow = "hidden";

        const temporizadorFoco = setTimeout(() => {
            entradaCorreo.current?.focus();
        }, 0);

        function manejarTecla(evento) {
            if (evento.key === "Escape") {
                evento.preventDefault();
                cerrar();
                return;
            }

            if (evento.key !== "Tab") {
                return;
            }

            const elementos = Array.from(
                dialogo.current?.querySelectorAll(
                    SELECTOR_FOQUEABLE
                ) || []
            );

            if (elementos.length === 0) {
                return;
            }

            const primero = elementos[0];
            const ultimo = elementos[elementos.length - 1];

            if (evento.shiftKey && document.activeElement === primero) {
                evento.preventDefault();
                ultimo.focus();
            } else if (
                !evento.shiftKey &&
                document.activeElement === ultimo
            ) {
                evento.preventDefault();
                primero.focus();
            }
        }

        document.addEventListener("keydown", manejarTecla);

        return () => {
            clearTimeout(temporizadorFoco);
            document.removeEventListener("keydown", manejarTecla);
            document.body.style.overflow = desbordamientoAnterior;

            if (elementoAnterior instanceof HTMLElement) {
                elementoAnterior.focus();
            }
        };
    }, [abierto, cerrar]);

    if (!abierto) {
        return null;
    }

    function limpiarRutaPendiente() {
        sessionStorage.removeItem(CLAVE_RUTA_PENDIENTE);
    }

    async function manejarLogin(evento) {
        evento.preventDefault();

        if (cargando) {
            return;
        }

        const correoLimpio = correo.trim();
        const passwordLimpia = password.trimEnd();

        setCorreo(correoLimpio);
        setPassword(passwordLimpia);

        if (!correoLimpio || !passwordLimpia) {
            setEstado({
                mostrar: true,
                tipo: "error"
            });

            return;
        }

        if (!navigator.onLine) {
            setEstado({
                mostrar: true,
                tipo: "conexion"
            });

            return;
        }

        try {
            setCargando(true);
            cargandoRef.current = true;

            const respuesta = await login(
                correoLimpio,
                passwordLimpia
            );

            iniciarSesion(
                respuesta.usuario,
                respuesta.token,
                true
            );

            setEstado({
                mostrar: true,
                tipo: "success"
            });

            temporizador.current = setTimeout(() => {
                limpiarRutaPendiente();
                reiniciar();

                navigate(destino, {
                    replace: true
                });
            }, 2000);
        } catch (error) {
            console.error(
                "ERROR LOGIN:",
                error
            );

            const errorConexion =
                !navigator.onLine ||
                error.code === "ERR_NETWORK" ||
                error.code === "ECONNABORTED" ||
                [502, 503, 504].includes(error.response?.status) ||
                !error.response;

            setEstado({
                mostrar: true,
                tipo: errorConexion
                    ? "conexion"
                    : "error"
            });
        } finally {
            cargandoRef.current = false;
            setCargando(false);
        }
    }

    const esError = estado.tipo === "error";
    const esConexion = estado.tipo === "conexion";
    const esExito = estado.tipo === "success";

    function cerrarSiFuera(evento) {
        if (evento.target !== evento.currentTarget) {
            return;
        }

        if (cargando) {
            return;
        }

        cerrar();
    }

    return (
        <div
            className="modal-login-fondo"
            onMouseDown={cerrarSiFuera}
        >
            <div
                className="modal-login"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-login-titulo"
                ref={dialogo}
            >
                <button
                    type="button"
                    className="modal-login-cerrar"
                    aria-label="Cerrar inicio de sesión"
                    onClick={cerrar}
                    disabled={cargando}
                >
                    ×
                </button>

                {estado.mostrar ? (
                    <>
                        <div
                            className={
                                esExito
                                    ? "modal-login-icono modal-login-icono-exito"
                                    : "modal-login-icono modal-login-icono-error"
                            }
                        >
                            {esExito ? "✓" : "!"}
                        </div>

                        <h2 id="modal-login-titulo">
                            {esConexion
                                ? "Servicio no disponible"
                                : esError
                                    ? "Credenciales incorrectas"
                                    : "Acceso exitoso"}
                        </h2>

                        <p>
                            {esConexion
                                ? "El sistema no pudo responder en este momento. Intenta nuevamente en unos minutos."
                                : esError
                                    ? "Verifica tu correo electrónico y contraseña e intenta nuevamente."
                                    : "Bienvenido a ExamPass. Redirigiendo..."}
                        </p>

                        {!esExito ? (
                            <button
                                type="button"
                                className="modal-login-aceptar"
                                onClick={() =>
                                    setEstado({
                                        mostrar: false,
                                        tipo: ""
                                    })
                                }
                            >
                                Aceptar
                            </button>
                        ) : (
                            <div className="modal-login-progreso" />
                        )}
                    </>
                ) : (
                    <>
                        <h1 id="modal-login-titulo">
                            Acceso al sistema
                        </h1>

                        <p className="modal-login-description">
                            Ingresa tus credenciales para continuar.
                        </p>

                        <form onSubmit={manejarLogin}>
                            <label htmlFor="modal-login-correo">
                                Correo electrónico
                            </label>

                            <div className="modal-login-input">
                                <input
                                    id="modal-login-correo"
                                    type="email"
                                    value={correo}
                                    maxLength={50}
                                    placeholder="202001068@edu.est.umss"
                                    ref={entradaCorreo}
                                    onChange={(e) =>
                                        setCorreo(
                                            e.target.value.trim().slice(0, 50)
                                        )
                                    }
                                />
                            </div>

                            <label htmlFor="modal-login-password">
                                Contraseña
                            </label>

                            <div className="modal-login-input">
                                <input
                                    id="modal-login-password"
                                    type={mostrar ? "text" : "password"}
                                    value={password}
                                    maxLength={20}
                                    placeholder="Ingresa tu contraseña"
                                    onChange={(e) =>
                                        setPassword(
                                            e.target.value.slice(0, 20)
                                        )
                                    }
                                />

                                <button
                                    type="button"
                                    className="modal-login-ojo"
                                    aria-label={
                                        mostrar
                                            ? "Ocultar contraseña"
                                            : "Mostrar contraseña"
                                    }
                                    onClick={() =>
                                        setMostrar(!mostrar)
                                    }
                                >
                                    {mostrar
                                        ? <FaEyeSlash />
                                        : <FaEye />}
                                </button>
                            </div>

                            <div className="modal-login-options">
                                <button
                                    type="button"
                                    className="modal-login-olvidaste"
                                    onClick={() =>
                                        navigate(
                                            "/recuperar-contrasena"
                                        )
                                    }
                                >
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>

                            <button
                                type="submit"
                                className="modal-login-enviar"
                                disabled={cargando}
                            >
                                {cargando
                                    ? "Procesando..."
                                    : "Iniciar sesión →"}
                            </button>

                            <button
                                type="button"
                                className="modal-login-cancelar"
                                onClick={cerrar}
                                disabled={cargando}
                            >
                                Cancelar
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

export default ModalInicioSesion;
