import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {useAuth} from "../../context/useAuth";
import "./Navbar.css";

function Navbar({cambiarSidebar}){

    const {usuario,cerrarSesion}=useAuth();
    const [menuAbierto,setMenuAbierto]=useState(false);
    const navigate=useNavigate();

    return(
        <header className="navbar">

            <button className="navbar-menu" onClick={cambiarSidebar}>
                ☰
            </button>

            {
            usuario ? (
                <div className="navbar-usuario" onClick={()=>setMenuAbierto(!menuAbierto)}>

                    <div className="navbar-avatar">
                        {(usuario.nombre||usuario.nombreCompleto||"U").charAt(0)}
                    </div>

                    <span>
                        {usuario.nombre||usuario.nombreCompleto||"Usuario"}
                    </span>

                    {
                    menuAbierto && (
                        <div className="navbar-dropdown">

                            <button onClick={(e)=>{
                                e.stopPropagation();
                                navigate("/perfil");
                            }}>
                                👤 Ver perfil
                            </button>

                            <button onClick={(e)=>{
                                e.stopPropagation();
                                cerrarSesion();
                            }}>
                                ↪ Cerrar sesión
                            </button>

                        </div>
                    )
                    }

                </div>
            ):(
                <button className="navbar-login" onClick={()=>navigate("/login")}>

                    <div className="navbar-avatar">
                        👤
                    </div>

                    <span>
                        Inicio de sesión
                    </span>

                </button>
            )
            }

        </header>
    );
}

export default Navbar;