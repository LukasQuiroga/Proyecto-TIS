import {useState} from "react";
import {NavLink} from "react-router-dom";
import {
    FiBarChart2,
    FiChevronDown,
    FiChevronUp,
    FiClipboard,
    FiClock,
    FiGrid,
    FiHome,
    FiMap,
    FiMenu,
    FiTarget,
    FiUsers
} from "react-icons/fi";
import {FaGraduationCap} from "react-icons/fa";
import {useAuth} from "../../context/useAuth";
import "./Sidebar.css";

function Opcion({to,icono,children,exacta=false}){
    return(
        <NavLink
            to={to}
            end={exacta}
            className={({isActive})=>
                `sidebar-opcion sidebar-opcion-enlace ${
                    isActive?"sidebar-activa":""
                }`
            }
        >
            <span className="sidebar-icono">
                {icono}
            </span>

            <span className="sidebar-texto">
                {children}
            </span>
        </NavLink>
    );
}

function Sidebar({sidebarAbierto,cambiarSidebar}){
    const [usuariosAbierto,setUsuariosAbierto]=useState(false);
    const {usuario}=useAuth();

    const tienePermiso=(permiso)=>{
        if(!usuario){
            return true;
        }

        return usuario?.permisos?.includes(permiso);
    };

    return(
        <aside className={sidebarAbierto?"sidebar abierto":"sidebar cerrado"}>
            <button
                type="button"
                className="sidebar-boton-menu"
                onClick={cambiarSidebar}
            >
                <FiMenu/>
            </button>

            {sidebarAbierto&&(
                <>
                    <NavLink
                        to="/"
                        className="sidebar-logo"
                    >
                        <div className="sidebar-logo-icono">
                            <FaGraduationCap/>
                        </div>

                        <div className="sidebar-logo-texto">
                            <strong>
                                Sistema de Control
                            </strong>

                            <span>
                                de Ingreso a Exámenes
                            </span>
                        </div>
                    </NavLink>

                    <nav className="sidebar-menu">
                        <Opcion
                            to="/"
                            exacta
                            icono={<FiHome/>}
                        >
                            Inicio
                        </Opcion>

                        {(tienePermiso("GESTIONAR_USUARIOS")||
                            tienePermiso("IMPORTAR_USUARIOS")||
                            tienePermiso("GESTIONAR_ROLES")||
                            tienePermiso("REGISTRAR_USUARIOS"))&&(
                            <>
                                <button
                                    type="button"
                                    className="sidebar-opcion sidebar-desplegable"
                                    onClick={()=>
                                        setUsuariosAbierto(!usuariosAbierto)
                                    }
                                >
                                    <span className="sidebar-icono">
                                        <FiUsers/>
                                    </span>

                                    <span className="sidebar-texto">
                                        Usuarios
                                    </span>

                                    <span className="sidebar-flecha">
                                        {usuariosAbierto
                                            ?<FiChevronUp/>
                                            :<FiChevronDown/>
                                        }
                                    </span>
                                </button>

                                {usuariosAbierto&&(
                                    <div className="sidebar-submenu">
                                        {tienePermiso("GESTIONAR_USUARIOS")&&(
                                            <NavLink
                                                to="/usuarios"
                                                end
                                                className={({isActive})=>
                                                    `sidebar-subopcion ${
                                                        isActive?"sidebar-subactiva":""
                                                    }`
                                                }
                                            >
                                                Listado de usuarios
                                            </NavLink>
                                        )}

                                        {tienePermiso("IMPORTAR_USUARIOS")&&(
                                            <NavLink
                                                to="/usuarios/importar"
                                                className="sidebar-subopcion"
                                            >
                                                Importar usuarios
                                            </NavLink>
                                        )}

                                        {tienePermiso("GESTIONAR_ROLES")&&(
                                            <NavLink
                                                to="/usuarios/roles-permisos"
                                                className={({isActive})=>
                                                    `sidebar-subopcion ${
                                                        isActive
                                                            ?"sidebar-subopcion-activa"
                                                            :""
                                                    }`
                                                }
                                            >
                                                Roles y permisos
                                            </NavLink>
                                        )}

                                        {tienePermiso("REGISTRAR_USUARIOS")&&(
                                            <NavLink
                                                to="/usuarios/registro"
                                                className="sidebar-subopcion"
                                            >
                                                Registro manual
                                            </NavLink>
                                        )}
                                    </div>
                                )}
                            </>
                        )}

                        {tienePermiso("GESTIONAR_EXAMENES")&&(
                            <div className="sidebar-opcion">
                                <span className="sidebar-icono">
                                    <FiClipboard/>
                                </span>

                                <span className="sidebar-texto">
                                    Exámenes
                                </span>
                            </div>
                        )}

                        {tienePermiso("GESTIONAR_AMBIENTES")&&(
                            <div className="sidebar-opcion">
                                <span className="sidebar-icono">
                                    <FiMap/>
                                </span>

                                <span className="sidebar-texto">
                                    Ambientes
                                </span>
                            </div>
                        )}

                        {tienePermiso("GESTIONAR_HABILITACIONES")&&(
                            <div className="sidebar-opcion">
                                <span className="sidebar-icono">
                                    <FiGrid/>
                                </span>

                                <span className="sidebar-texto">
                                    Habilitaciones
                                </span>
                            </div>
                        )}

                        {tienePermiso("CONTROL_INGRESO")&&(
                            <div className="sidebar-opcion">
                                <span className="sidebar-icono">
                                    <FiTarget/>
                                </span>

                                <span className="sidebar-texto">
                                    Control de ingreso
                                </span>
                            </div>
                        )}

                        {tienePermiso("GENERAR_REPORTES")&&(
                            <div className="sidebar-opcion">
                                <span className="sidebar-icono">
                                    <FiBarChart2/>
                                </span>

                                <span className="sidebar-texto">
                                    Reportes
                                </span>
                            </div>
                        )}

                        {tienePermiso("VER_AUDITORIA")&&(
                            <Opcion
                                to="/auditoria"
                                icono={<FiClock/>}
                            >
                                Auditoría
                            </Opcion>
                        )}
                    </nav>
                </>
            )}
        </aside>
    );
}

export default Sidebar;