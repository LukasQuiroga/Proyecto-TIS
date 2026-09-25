import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import "./Navbar.css";

function Navbar(){

    const navigate = useNavigate();
    const { usuario } = useAuth();

    return(
        <header className="navbar">

            <div className="navbar-menu">
                ☰
            </div>

            <div 
                className="navbar-login"
                onClick={() => navigate("/login")}
            >

                <div className="navbar-avatar">
                    👤
                </div>

                <span>
                    {usuario ? usuario.nombre : "Inicio de sesión"}
                </span>

            </div>

        </header>
    );
}

export default Navbar;