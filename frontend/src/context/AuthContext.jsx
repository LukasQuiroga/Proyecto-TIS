import { useEffect, useState } from "react";
import { AuthContext } from "./authContext";
import { obtenerPermisosActuales } from "../services/authService";



export function AuthProvider({ children }) {


    const [usuario, setUsuario] = useState(() => {


        const usuarioGuardado =
            localStorage.getItem("usuario")||
            sessionStorage.getItem("usuario");


        return usuarioGuardado
            ? JSON.parse(usuarioGuardado)
            : null;


    });

    const [permisosActualizados, setPermisosActualizados] = useState(false);
    
    useEffect(() => {
        if (!usuario?.idUsuario) {
            return;
        }
        const verificarPermisos = async () => {
            try {
                const permisosActuales =
                    await obtenerPermisosActuales(
                        usuario.idUsuario
                    );
                const permisosSesion =
                    usuario.permisos || [];

                const permisosActualesOrdenados =
                    [...permisosActuales].sort();

                const permisosSesionOrdenados =
                    [...permisosSesion].sort();

                const cambiaron =
                    JSON.stringify(permisosActualesOrdenados) !==
                    JSON.stringify(permisosSesionOrdenados);
                if (cambiaron) {
                    setPermisosActualizados(true);
                }
            } catch(error) {
                console.error(
                    "Error verificando permisos:",
                    error
                );
            }
        };
        verificarPermisos();
        const intervalo = setInterval(
            verificarPermisos,
            30000
        );
        return () => clearInterval(intervalo);
    }, [usuario]);


    const cargando = false;




    const iniciarSesion = (datosUsuario, recordar = false) => {


        setUsuario(datosUsuario);



        if(recordar){


            localStorage.setItem(
                "usuario",
                JSON.stringify(datosUsuario)
            );


        }
        else{


            sessionStorage.setItem(
                "usuario",
                JSON.stringify(datosUsuario)
            );


        }


    };






    const cerrarSesion = () => {


        setUsuario(null);


        localStorage.removeItem("usuario");


        sessionStorage.removeItem("usuario");


    };





    return (

        <AuthContext.Provider

            value={{
                usuario,
                cargando,
                iniciarSesion,
                cerrarSesion,
                permisosActualizados,
                setPermisosActualizados
            }}

        >

            {children}

        </AuthContext.Provider>

    );
    
}