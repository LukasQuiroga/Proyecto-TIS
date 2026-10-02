import {
    FiMail,
    FiShield,
    FiUser
} from "react-icons/fi";
import {useAuth} from "../../context/useAuth";
import "./Perfil.css";

function Perfil(){

    const {usuario}=useAuth();

    const nombre=
        usuario?.nombre||
        usuario?.nombreCompleto||
        "Usuario";

    const apellido=
        usuario?.apellido||
        "No registrado";

    const correo=
        usuario?.correo||
        "No registrado";

    const obtenerRol=()=>{

        if(usuario?.nombreRol){
            return usuario.nombreRol;
        }

        if(usuario?.rol?.nombreRol){
            return usuario.rol.nombreRol;
        }

        if(usuario?.rol?.nombre){
            return usuario.rol.nombre;
        }

        if(typeof usuario?.rol==="string"){
            return usuario.rol;
        }

        if(Array.isArray(usuario?.roles)&&usuario.roles.length>0){
            return(
                usuario.roles[0]?.nombreRol||
                usuario.roles[0]?.nombre||
                "Usuario"
            );
        }

        return "Usuario";
    };

    const rol=obtenerRol();

    return(
        <div className="perfil-container">
            <section className="perfil-card">
                <div className="perfil-portada"></div>

                <div className="perfil-cabecera">
                    <div className="perfil-avatar">
                        {nombre.charAt(0).toUpperCase()}
                    </div>

                    <h1>
                        {nombre}
                    </h1>

                    <span className="perfil-rol-principal">
                        {rol}
                    </span>
                </div>

                <div className="perfil-separador"></div>

                <div className="perfil-datos">
                    <div className="perfil-dato">
                        <div className="perfil-dato-icono">
                            <FiUser/>
                        </div>

                        <div className="perfil-dato-contenido">
                            <label>Nombre</label>
                            <p>{nombre}</p>
                        </div>
                    </div>

                    <div className="perfil-dato">
                        <div className="perfil-dato-icono">
                            <FiUser/>
                        </div>

                        <div className="perfil-dato-contenido">
                            <label>Apellido</label>
                            <p>{apellido}</p>
                        </div>
                    </div>

                    <div className="perfil-dato">
                        <div className="perfil-dato-icono">
                            <FiMail/>
                        </div>

                        <div className="perfil-dato-contenido">
                            <label>Correo electrónico</label>
                            <p>{correo}</p>
                        </div>
                    </div>

                    <div className="perfil-dato">
                        <div className="perfil-dato-icono">
                            <FiShield/>
                        </div>

                        <div className="perfil-dato-contenido">
                            <label>Rol</label>
                            <p>{rol}</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Perfil;  