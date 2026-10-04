import {Navigate} from "react-router-dom";
import {useAuth} from "../context/useAuth";

function ProtectedRoute({children}){

    const {
        usuario,
        token,
        cargando
    }=useAuth();

    if(cargando){
        return null;
    }

    if(!usuario || !token){

        return(
            <Navigate
                to="/login"
                replace
            />
        );
    }

    return children;
}

export default ProtectedRoute;