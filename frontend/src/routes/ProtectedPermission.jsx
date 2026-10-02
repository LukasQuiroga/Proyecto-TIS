import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import AccesoDenegado from "./AccesoDenegado";

function ProtectedPermission({
    children,
    permiso
}) {
    const { usuario } = useAuth();

    if(!usuario){
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    const tienePermiso =
        usuario.permisos?.includes(permiso);

    if(!tienePermiso){

        return <AccesoDenegado />;

    }
    return children;

}

export default ProtectedPermission;