
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function ProtectedRoute({ children }) {
    const { usuario, token, cargando } = useAuth();
    const location = useLocation();

    if (cargando) {
        return null;
    }

    if (!usuario || !token) {
        return (
            <Navigate
                to="/login"
                state={{
                    from: {
                        pathname: location.pathname,
                        search: location.search,
                        hash: location.hash
                    }
                }}
                replace
            />
        );
    }

    return children;
}

export default ProtectedRoute;