import {useState} from "react";
import {AuthContext} from "./authContext";

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

    const cargando=false;

    const iniciarSesion=(
        datosUsuario,
        tokenJwt,
        recordar=false
    )=>{

        setUsuario(datosUsuario);
        setToken(tokenJwt);

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
                cerrarSesion
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}