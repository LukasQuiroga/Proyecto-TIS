import { useEffect, useState } from "react";
import {Outlet} from "react-router-dom";
import Navbar from "../Navbar/Navbar.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";
import useInactividad from "../../hooks/useInactividad.js";
import {useAuth} from "../../context/useAuth";
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

    const {token}=useAuth();

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

                <Navbar/>

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