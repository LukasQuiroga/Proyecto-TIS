import { useState } from "react";
import { AuthContext } from "./authContext";



export function AuthProvider({ children }) {


    const [usuario, setUsuario] = useState(() => {


        const usuarioGuardado =
            localStorage.getItem("usuario");


        return usuarioGuardado
            ? JSON.parse(usuarioGuardado)
            : null;


    });



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
                cerrarSesion
            }}

        >

            {children}

        </AuthContext.Provider>

    );
    
}