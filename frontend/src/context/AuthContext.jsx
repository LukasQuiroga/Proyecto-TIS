import {useEffect,useState} from "react";
import {AuthContext} from "./authContext";
import {obtenerPermisosActuales} from "../services/authService";

export function AuthProvider({children}){

    const [usuario,setUsuario]=useState(()=>{

        const usuarioGuardado=
            localStorage.getItem("usuario")||
            sessionStorage.getItem("usuario");

        return usuarioGuardado
            ?JSON.parse(usuarioGuardado)
            :null;
    });

    const [token,setToken]=useState(()=>{

        return(
            localStorage.getItem("token")||
            sessionStorage.getItem("token")
        );
    });

    const [permisosActualizados,setPermisosActualizados]=
        useState(false);

    useEffect(()=>{

        if(!usuario?.idUsuario || !token){
            return;
        }

        const verificarPermisos=async()=>{

            try{

                const permisosActuales=
                    await obtenerPermisosActuales(
                        usuario.idUsuario
                    );

                const permisosSesion=
                    usuario.permisos||[];

                const permisosActualesOrdenados=
                    [...permisosActuales].sort();

                const permisosSesionOrdenados=
                    [...permisosSesion].sort();

                const cambiaron=
                    JSON.stringify(
                        permisosActualesOrdenados
                    )!==
                    JSON.stringify(
                        permisosSesionOrdenados
                    );

                if(cambiaron){
                    setPermisosActualizados(true);
                }

            }catch(error){

                console.error(
                    "Error verificando permisos:",
                    error
                );
            }
        };

        verificarPermisos();

        const intervalo=setInterval(
            verificarPermisos,
            30000
        );

        return()=>{
            clearInterval(intervalo);
        };

    },[usuario,token]);

    const cargando=false;

    const iniciarSesion=(
        datosUsuario,
        tokenJwt,
        recordar=false
    )=>{

        setUsuario(datosUsuario);
        setToken(tokenJwt);
        setPermisosActualizados(false);

        localStorage.removeItem("usuario");
        localStorage.removeItem("token");

        sessionStorage.removeItem("usuario");
        sessionStorage.removeItem("token");

        if(recordar){

            localStorage.setItem(
                "usuario",
                JSON.stringify(datosUsuario)
            );

            localStorage.setItem(
                "token",
                tokenJwt
            );

        }else{

            sessionStorage.setItem(
                "usuario",
                JSON.stringify(datosUsuario)
            );

            sessionStorage.setItem(
                "token",
                tokenJwt
            );
        }

        localStorage.setItem(
            "ultimaActividad",
            Date.now().toString()
        );
    };

    const cerrarSesion=()=>{

        setUsuario(null);
        setToken(null);
        setPermisosActualizados(false);

        localStorage.removeItem("usuario");
        localStorage.removeItem("token");
        localStorage.removeItem("ultimaActividad");

        sessionStorage.removeItem("usuario");
        sessionStorage.removeItem("token");
    };

    return(
        <AuthContext.Provider
            value={{
                usuario,
                token,
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