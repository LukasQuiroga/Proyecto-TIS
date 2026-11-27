import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../Navbar/Navbar.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";
import useInactividad from "../../hooks/useInactividad.js";
import {useAuth} from "../../context/useAuth";
import EstadoConexion from "../EstadoConexion/EstadoConexion.jsx";
import ModalInicioSesion from "../InicioSesion/ModalInicioSesion.jsx";
import "./PlantillaPrincipal.css";

function PlantillaPrincipal(){

    const [sidebarAbierto, setSidebarAbierto] = useState(() => {
        return sessionStorage.getItem("sidebarAbierto") === "true";
    });

    const cambiarSidebar = () => {
        setSidebarAbierto((anterior) => !anterior);
    };

    useEffect(() => {
        sessionStorage.setItem("sidebarAbierto", String(sidebarAbierto));
    }, [sidebarAbierto]);

    const location = useLocation();
    const navigate = useNavigate();
    const {token}=useAuth();

    const debeAbrirLogin = new URLSearchParams(location.search).has(
        "iniciar-sesion"
    );

    const [overrideLogin, setOverrideLogin] = useState({
        clave: null,
        abierto: null
    });

    const loginAbierto =
        overrideLogin.clave === location.key
            ? overrideLogin.abierto
            : debeAbrirLogin;

    const abrirLogin = useCallback(() => {
        if (!token) {
            setOverrideLogin({
                clave: location.key,
                abierto: true
            });
        }
    }, [location.key, token]);

    const cerrarLogin = useCallback(() => {
        setOverrideLogin({
            clave: location.key,
            abierto: false
        });

        const parametros = new URLSearchParams(location.search);

        if (!parametros.has("iniciar-sesion")) {
            return;
        }

        parametros.delete("iniciar-sesion");

        const busqueda = parametros.toString();

        navigate(
            {
                pathname: location.pathname,
                search: busqueda ? `?${busqueda}` : "",
                hash: location.hash
            },
            {replace:true}
        );
    }, [
        location.hash,
        location.key,
        location.pathname,
        location.search,
        navigate
    ]);

    useInactividad();

    return(
        <div className="plantilla-pagina">

            {token&&(
                <Sidebar
                    sidebarAbierto={sidebarAbierto}
                    cambiarSidebar={cambiarSidebar}
                />
            )}

            <div
                className={
                    !token
                        ?"plantilla-zona-principal sin-sidebar"
                        :sidebarAbierto
                            ?"plantilla-zona-principal abierto"
                            :"plantilla-zona-principal cerrado"
                }
            >

                <Navbar abrirLogin={abrirLogin}/>

                <EstadoConexion />

                <ModalInicioSesion
                    abierto={loginAbierto}
                    onCerrar={cerrarLogin}
                />

                <main className="plantilla-contenido">
                    <Outlet/>
                </main>

                <footer className="plantilla-footer">
                    <span>
                        Sistema de Control de Ingreso a Exámenes Masivos
                    </span>

                    <span>
                        © 2026. Todos los derechos reservados.
                    </span>
                </footer>

            </div>

        </div>
    );
}

export default PlantillaPrincipal;
