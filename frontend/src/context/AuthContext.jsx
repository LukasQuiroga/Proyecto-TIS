import {useEffect,useState} from "react";
import {AuthContext} from "./authContext";
import {obtenerPermisosActuales} from "../services/authService";

export function AuthProvider({children}){

    const [sesionInicial] = useState(() => {
        for (const almacen of [localStorage, sessionStorage]) {
            const tokenGuardado = almacen.getItem("token");
            const usuarioGuardado = almacen.getItem("usuario");
            if (!tokenGuardado || !usuarioGuardado) continue;
            try {
                return { usuario: JSON.parse(usuarioGuardado), token: tokenGuardado };
            } catch {
                almacen.removeItem("usuario");
                almacen.removeItem("token");
            }
        }
        return { usuario: null, token: null };
    });

    const [usuario,setUsuario]=useState(sesionInicial.usuario);
    const [token,setToken]=useState(sesionInicial.token);

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

    useEffect(() => {
        const sincronizarSesion = (evento) => {
            if (evento.storageArea !== localStorage ||
                (evento.key !== "usuario" &&
                 evento.key !== "token" &&
                 evento.key !== null)) {
                return;
            }

            const tokenGuardado = localStorage.getItem("token");
            const datosGuardados = localStorage.getItem("usuario");
            let siguienteUsuario = null;

            try {
                siguienteUsuario = datosGuardados
                    ? JSON.parse(datosGuardados)
                    : null;
            } catch {
                siguienteUsuario = null;
            }

            if (!tokenGuardado || !siguienteUsuario) {
                setUsuario(null);
                setToken(null);
            } else {
                setUsuario(siguienteUsuario);
                setToken(tokenGuardado);
            }

            setPermisosActualizados(false);

            if (window.location.pathname !== "/" &&
                window.location.pathname !== "/login") {
                window.location.replace("/");
            }
        };

        window.addEventListener("storage", sincronizarSesion);
        return () => window.removeEventListener("storage", sincronizarSesion);
    }, []);

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