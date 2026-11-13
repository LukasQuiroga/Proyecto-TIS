import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowLeft, FiCamera, FiCheck, FiLock,
  FiSave, FiShield, FiUser,
} from "react-icons/fi";
import {
  actualizarFotoPerfil,
  actualizarTelefonoPerfil,
  cambiarContrasenaPerfil,
  obtenerFotoPerfil,
  obtenerMensajeErrorPerfil,
  obtenerMiPerfil,
} from "../../services/perfilService";
import "./Perfil.css";

const TELEFONO = /^[0-9]{1,10}$/;

function EditarPerfil() {
  const navigate = useNavigate();
  const inputFoto = useRef(null);
  const fotoPersistidaRef = useRef(null);
  const [perfil, setPerfil] = useState(null);
  const [telefono, setTelefono] = useState("");
  const [foto, setFoto] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [fotoTemporal, setFotoTemporal] = useState("");
  const [contrasenas, setContrasenas] = useState({
    contrasenaActual: "", nuevaContrasena: "", confirmarContrasena: "",
  });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      try {
        const respuesta = await obtenerMiPerfil();
        if (!activo) return;
        setPerfil(respuesta);
        setTelefono(respuesta.usuario?.celular || "");
        if (respuesta.fotoPerfil) {
          try {
            const blob = await obtenerFotoPerfil();
            if (!activo) return;
            const url = URL.createObjectURL(blob);
            fotoPersistidaRef.current = url;
            setFoto(url);
          } catch {
            if (activo) setFoto("");
          }
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
      if (fotoPersistidaRef.current) {
        URL.revokeObjectURL(fotoPersistidaRef.current);
        fotoPersistidaRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!fotoTemporal) return undefined;
    return () => URL.revokeObjectURL(fotoTemporal);
  }, [fotoTemporal]);

  const usuario = perfil?.usuario;
  const nombre = [usuario?.nombre, usuario?.apellido].filter(Boolean).join(" ") || "Usuario";
  const huboCambiosClave = Object.values(contrasenas).some(Boolean);
  const telefonoCambiado = telefono.trim() !== (usuario?.celular || "");
  const hayCambios = Boolean(archivo || telefonoCambiado || huboCambiosClave);

  const cambiarFoto = (event) => {
    const seleccionado = event.target.files?.[0];
    if (!seleccionado) return;
    if (!["image/jpeg", "image/png"].includes(seleccionado.type)) {
      setError("Selecciona una fotografía JPG o PNG.");
      event.target.value = "";
      return;
    }
    if (seleccionado.size > 2 * 1024 * 1024) {
      setError("La fotografía no puede superar 2 MB.");
      event.target.value = "";
      return;
    }
    setError("");
    setMensaje("");
    setFotoTemporal(URL.createObjectURL(seleccionado));
    setArchivo(seleccionado);
  };

  const guardar = async (event) => {
    event.preventDefault();
    setError("");
    setMensaje("");
    if (!hayCambios) return;
    if (telefonoCambiado && telefono.trim() && !TELEFONO.test(telefono.trim())) {
      setError("El número de teléfono debe contener como máximo 10 dígitos.");
      return;
    }
    if (huboCambiosClave) {
      if (!contrasenas.contrasenaActual || !contrasenas.nuevaContrasena || !contrasenas.confirmarContrasena) {
        setError("Completa los tres campos de contraseña.");
        return;
      }
      if (contrasenas.nuevaContrasena !== contrasenas.confirmarContrasena) {
        setError("Las contraseñas nuevas no coinciden.");
        return;
      }
      if (!/^(?=.{8,64}$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/.test(contrasenas.nuevaContrasena)) {
        setError("La nueva contraseña debe tener 8–64 caracteres, mayúscula, minúscula y número.");
        return;
      }
    }

    setGuardando(true);
    const completados = [];
    try {
      if (telefonoCambiado) {
        await actualizarTelefonoPerfil(telefono.trim());
        completados.push("teléfono");
        setPerfil((anterior) => ({ ...anterior, usuario: { ...anterior.usuario, celular: telefono.trim() } }));
      }
      if (archivo) {
        await actualizarFotoPerfil(archivo);
        completados.push("fotografía");
        setArchivo(null);
        try {
          const blob = await obtenerFotoPerfil();
          const nuevaUrl = URL.createObjectURL(blob);
          if (fotoPersistidaRef.current) {
            URL.revokeObjectURL(fotoPersistidaRef.current);
          }
          fotoPersistidaRef.current = nuevaUrl;
          setFoto(nuevaUrl);
          setFotoTemporal("");
        } catch (errorRecuperacion) {
          console.warn("No se pudo actualizar la vista previa de la fotografía:", errorRecuperacion);
        }
        window.dispatchEvent(new Event("perfil-foto-actualizada"));
      }
      if (huboCambiosClave) {
        await cambiarContrasenaPerfil(contrasenas);
        completados.push("contraseña");
        setContrasenas({ contrasenaActual: "", nuevaContrasena: "", confirmarContrasena: "" });
      }
      setMensaje(`Cambios guardados: ${completados.join(", ")}.`);
    } catch (err) {
      const detalle = obtenerMensajeErrorPerfil(err);
      setError(completados.length
        ? `Se guardó ${completados.join(", ")}, pero no se completó el resto: ${detalle}`
        : detalle);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="hu13-pagina">
      <div className="hu13-contenedor">
        <div className="hu13-encabezado">
          <div>
            <Link to="/perfil" className="hu13-volver"><FiArrowLeft /> Volver a mi perfil</Link>
            <h1>Editar perfil</h1>
            <p>Actualiza tus datos de contacto y seguridad.</p>
          </div>
        </div>
        {cargando && <div className="hu13-mensaje">Cargando información…</div>}
        {!cargando && !usuario && <div className="hu13-mensaje hu13-error">{error || "No se pudo cargar el perfil."}</div>}
        {!cargando && usuario && (
          <form onSubmit={guardar} noValidate>
            <div className="hu13-edicion-grid">
              <section className="hu13-tarjeta hu13-seccion hu13-bloqueo">
                <h3><FiLock /> Datos institucionales</h3>
                <p className="hu13-ayuda">Esta información solo puede modificarla un administrador.</p>
                <div className="hu13-campos">
                  <label>Nombre completo<input value={nombre} disabled readOnly /></label>
                  <label>Documento de identidad<input value={usuario.carnetIdentidad || ""} disabled readOnly /></label>
                  <label>Correo electrónico<input value={usuario.correo || ""} disabled readOnly /></label>
                  <label>Rol<input value={usuario.nombreRol || ""} disabled readOnly /></label>
                  <label>Estado<input value={usuario.activo ? "Activo" : "Inactivo"} disabled readOnly /></label>
                </div>
                <p className="hu13-aviso"><FiShield /> Para modificar estos datos, contacta al administrador.</p>
              </section>

              <div className="hu13-panel-edicion">
                <section className="hu13-tarjeta hu13-seccion">
                  <h3><FiUser /> Datos que puedes editar</h3>
                  <div className="hu13-foto-editar">
                    <div className="hu13-avatar">
                      {fotoTemporal || foto ? <img src={fotoTemporal || foto} alt="Vista previa de fotografía" /> : nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <strong>Foto de perfil</strong>
                      <p>Un solo rostro de frente y centrado · Cualquier dimensión o proporción · JPG/PNG · Máximo 2 MB</p>
                      <input className="hu13-oculto" ref={inputFoto} type="file" accept="image/png,image/jpeg" onChange={cambiarFoto} />
                      <button className="hu13-boton hu13-boton-secundario" type="button" onClick={() => inputFoto.current?.click()}><FiCamera /> Cambiar foto</button>
                    </div>
                  </div>
                  <div className="hu13-campos">
                    <label>
                      Teléfono de contacto
                      <input
                        autoComplete="tel"
                        type="tel"
                        inputMode="numeric"
                        value={telefono}
                        onChange={(e) =>
                          setTelefono(e.target.value.replace(/\D/g, "").slice(0, 10))
                        }
                        placeholder="70707070"
                        maxLength={10}
                      />
                    </label>
                  </div>
                </section>
                <section className="hu13-tarjeta hu13-seccion">
                  <h3><FiLock /> Cambiar contraseña</h3>
                  <p className="hu13-ayuda">Deja los campos vacíos si no deseas cambiarla.</p>
                  <div className="hu13-campos">
                    <label>Contraseña actual<input type="password" autoComplete="current-password" value={contrasenas.contrasenaActual} onChange={(e) => setContrasenas((p) => ({ ...p, contrasenaActual: e.target.value }))} /></label>
                    <label>Nueva contraseña<input type="password" autoComplete="new-password" value={contrasenas.nuevaContrasena} onChange={(e) => setContrasenas((p) => ({ ...p, nuevaContrasena: e.target.value }))} /></label>
                    <label>Confirmar nueva contraseña<input type="password" autoComplete="new-password" value={contrasenas.confirmarContrasena} onChange={(e) => setContrasenas((p) => ({ ...p, confirmarContrasena: e.target.value }))} /></label>
                  </div>
                </section>
              </div>
            </div>
            {error && <div className="hu13-mensaje hu13-error" role="alert">{error}</div>}
            {mensaje && <div className="hu13-mensaje hu13-exito" role="status"><FiCheck /> {mensaje}</div>}
            <div className="hu13-tarjeta hu13-acciones">
              <Link to="/perfil" className="hu13-boton hu13-boton-secundario">Cancelar</Link>
              <button type="submit" className="hu13-boton hu13-boton-primario" disabled={guardando || !hayCambios}><FiSave /> {guardando ? "Guardando…" : "Guardar cambios"}</button>
              {mensaje && <button type="button" className="hu13-boton hu13-boton-secundario" onClick={() => navigate("/perfil")}>Ver mi perfil</button>}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default EditarPerfil;