import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiBookOpen, FiBriefcase, FiEdit2, FiHash, FiMail,
  FiPhone, FiShield, FiUser, FiCheckCircle, FiRefreshCw,
} from "react-icons/fi";
import {
  obtenerFotoPerfil,
  obtenerMensajeErrorPerfil,
  obtenerMiPerfil,
} from "../../services/perfilService";
import "./Perfil.css";

const valor = (dato) => (dato === null || dato === undefined || dato === "" ? "No registrado" : dato);

function Perfil() {
  const [perfil, setPerfil] = useState(null);
  const [foto, setFoto] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let activo = true;
    let url = "";
    const cargar = async () => {
      setCargando(true);
      setError("");
      try {
        const respuesta = await obtenerMiPerfil();
        if (!activo) return;
        setPerfil(respuesta);
        if (respuesta.fotoPerfil) {
          try {
            const imagen = await obtenerFotoPerfil();
            if (!activo) return;
            url = URL.createObjectURL(imagen);
            setFoto(url);
          } catch {
            if (activo) setFoto("");
          }
        } else {
          setFoto("");
        }
      } catch (err) {
        if (activo) setError(obtenerMensajeErrorPerfil(err));
      } finally {
        if (activo) setCargando(false);
      }
    };
    cargar();
    return () => {
      activo = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [revision]);

  const usuario = perfil?.usuario;
  const nombre = [usuario?.nombre, usuario?.apellido].filter(Boolean).join(" ") || "Usuario";
  const rol = usuario?.nombreRol || "Usuario";
  const carreras = usuario?.carreras?.map((c) => c.nombre).filter(Boolean).join(", ");
  const materias = usuario?.materias
    ?.map((m) => {
      const nombre = m.nombreAsignatura || m.nombre || m.nombreMateria || m.codigo;
      return nombre ? `${nombre}${m.grupo ? ` (grupo ${m.grupo})` : ""}` : null;
    })
    .filter(Boolean)
    .join(", ");

  return (
    <div className="hu13-pagina">
      <div className="hu13-contenedor">
        <div className="hu13-encabezado">
          <div>
            <span className="hu13-eyebrow">CUENTA PERSONAL</span>
            <h1>Mi perfil</h1>
            <p>Consulta tu información personal y académica.</p>
          </div>
          {usuario && <Link className="hu13-boton hu13-boton-primario" to="/perfil/editar"><FiEdit2 /> Editar perfil</Link>}
        </div>

        {cargando && <div className="hu13-mensaje">Cargando información del perfil…</div>}
        {!cargando && error && (
          <div className="hu13-mensaje hu13-error" role="alert">{error} <button type="button" onClick={() => setRevision((n) => n + 1)}><FiRefreshCw /> Reintentar</button></div>
        )}
        {!cargando && usuario && (
          <>
            <section className="hu13-tarjeta hu13-resumen">
              <div className="hu13-portada" />
              <div className="hu13-resumen-contenido">
                <div className="hu13-avatar hu13-avatar-grande">
                  {foto ? <img src={foto} alt="Fotografía de perfil" /> : nombre.charAt(0).toUpperCase()}
                </div>
                <div className="hu13-identidad">
                  <h2>{nombre}</h2>
                  <span className="hu13-etiqueta-rol">{rol}</span>
                  <span className={`hu13-estado ${usuario.activo ? "hu13-activo" : "hu13-inactivo"}`}>
                    <FiCheckCircle /> {usuario.activo ? "Cuenta activa" : "Cuenta inactiva"}
                  </span>
                </div>
              </div>
            </section>

            <div className="hu13-columnas">
              <section className="hu13-tarjeta hu13-seccion">
                <h3><FiUser /> Información personal</h3>
                <div className="hu13-listado">
                  <div><FiUser /><span>Nombre completo<strong>{nombre}</strong></span></div>
                  <div><FiHash /><span>Documento de identidad<strong>{valor(usuario.carnetIdentidad)}</strong></span></div>
                  <div><FiMail /><span>Correo electrónico<strong>{valor(usuario.correo)}</strong></span></div>
                  <div><FiPhone /><span>Teléfono de contacto<strong>{valor(usuario.celular)}</strong></span></div>
                </div>
              </section>
              <section className="hu13-tarjeta hu13-seccion">
                <h3><FiShield /> Información institucional</h3>
                <div className="hu13-listado">
                  <div><FiShield /><span>Rol<strong>{rol}</strong></span></div>
                  <div><FiBriefcase /><span>Carrera(s)<strong>{valor(carreras)}</strong></span></div>
                  <div><FiBookOpen /><span>Materias asignadas o inscritas<strong>{valor(materias)}</strong></span></div>
                  {usuario.codigoSis && <div><FiHash /><span>Código SIS<strong>{usuario.codigoSis}</strong></span></div>}
                </div>
              </section>
            </div>
            <p className="hu13-nota">Los datos institucionales solo pueden modificarse mediante la administración del sistema.</p>
          </>
        )}
      </div>
    </div>
  );
}

export default Perfil;
