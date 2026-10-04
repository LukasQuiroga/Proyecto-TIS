import "./EditarUsuario.css";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  obtenerMaterias,
  obtenerUsuario,
  modificarUsuario,
} from "../../services/usuarioService";
import { obtenerRoles } from "../../services/rolService";

function EditarUsuario() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState(null);
  const [usuarioOriginal, setUsuarioOriginal] = useState(null);

  const [roles, setRoles] = useState([]);
  const [materiasDisponibles, setMateriasDisponibles] = useState([]);

  const [materiasSeleccionadas, setMateriasSeleccionadas] = useState([]);
  const [materiasOriginales, setMateriasOriginales] = useState([]);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setError("");

        const [usuarioRespuesta, rolesRespuesta, materiasRespuesta] =
          await Promise.all([
            obtenerUsuario(id),
            obtenerRoles(),
            obtenerMaterias(),
          ]);

        const datos = usuarioRespuesta.data;

        const usuarioCargado = {
               nombre: datos.nombre || "",
               apellido: datos.apellido || "",
               carnetIdentidad: datos.carnetIdentidad || "",
               correo: datos.correo || "",
               celular: datos.celular || "",
               carrera: datos.carrera || "",
               codigoSis: datos.codigoSis || "",
               idRol: datos.idRol || "",
               activo: datos.activo ?? true,
        };

             setUsuario(usuarioCargado);

             setUsuarioOriginal({
               ...usuarioCargado
        });

        setRoles(rolesRespuesta.data || []);

        setMateriasDisponibles(materiasRespuesta.data || []);

       const materiasUsuario = (datos.materias || []).map( 
        (materia) => materia.idMateria
    );
   
             setMateriasSeleccionadas(
               materiasUsuario
     );

             setMateriasOriginales(
             [...materiasUsuario]
      );

      } catch (error) {
        console.error("Error cargando usuario:", error);

        setError(
          error.response?.data?.message ||
            "No se pudo cargar la información del usuario",
        );
      }
    };

    cargarDatos();
  }, [id]);

  const actualizarCampo = (campo, valor) => {
    setUsuario((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  };

  const cambiarMateria = (idMateria) => {
    setMateriasSeleccionadas((actual) => {
      if (actual.includes(idMateria)) {
        return actual.filter((idActual) => idActual !== idMateria);
      }

      return [...actual, idMateria];
    });
  };

  const hayCambios = () => {

    if(!usuarioOriginal || !usuario){
        return false;
    }

    const actual = {
        nombre: usuario.nombre.trim(),
        apellido: usuario.apellido.trim(),
        carnetIdentidad: usuario.carnetIdentidad.trim(),
        correo: usuario.correo.trim(),
        celular: usuario.celular?.trim() || "",
        carrera: usuario.carrera?.trim() || "",
        activo: usuario.activo,
    };

    const original = {
        nombre: usuarioOriginal.nombre.trim(),
        apellido: usuarioOriginal.apellido.trim(),
        carnetIdentidad:
            usuarioOriginal.carnetIdentidad.trim(),
        correo: usuarioOriginal.correo.trim(),
        celular:
            usuarioOriginal.celular?.trim() || "",
        carrera:
            usuarioOriginal.carrera?.trim() || "",
        activo: usuarioOriginal.activo,
    };

    const datosModificados =
        JSON.stringify(actual) !==
        JSON.stringify(original);


    const materiasActuales =
        [...materiasSeleccionadas]
            .map(Number)
            .sort((a,b)=>a-b);

    const materiasIniciales =
        [...materiasOriginales]
            .map(Number)
            .sort((a,b)=>a-b);


    const materiasModificadas =
        JSON.stringify(materiasActuales) !==
        JSON.stringify(materiasIniciales);


    return (
        datosModificados ||
        materiasModificadas
    );

};

  const validarFormulario = () => {
    if (!usuario.nombre.trim()) {
      return "El nombre es obligatorio";
    }

    if (!usuario.apellido.trim()) {
      return "El apellido es obligatorio";
    }
    
    const nombreValido = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/;

    if (!nombreValido.test(usuario.nombre.trim())) {
       return "El nombre solo debe contener letras";
    }

    if (!nombreValido.test(usuario.apellido.trim())) {
       return "Los apellidos solo deben contener letras";
    }

    if (!usuario.carnetIdentidad.trim()) {
      return "El carnet de identidad es obligatorio";
    }

    if (!/^[0-9]+$/.test(usuario.carnetIdentidad.trim())) {
      return "El carnet de identidad solo debe contener números";
    }

    if (!usuario.correo.trim()) {
      return "El correo es obligatorio";
    }

    const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!correoValido.test(usuario.correo.trim())) {
      return "El correo no tiene un formato válido";
    }
    if (usuario.celular?.trim() &&
        !/^[0-9]+$/.test(usuario.celular.trim())
      ) {
          return "El teléfono solo debe contener números";
    }

    if (!usuario.idRol) {
      return "Debe seleccionar un rol";
    }

    return null;
  };

  const guardar = async (e) => {
    e.preventDefault();

    const mensajeValidacion = validarFormulario();

    if (mensajeValidacion) {
      setError(mensajeValidacion);
      setMensaje("");

      return;
    }

    try {
      setGuardando(true);
      setError("");
      setMensaje("");

      const datosModificar = {
        nombre: usuario.nombre.trim(),
        apellido: usuario.apellido.trim(),
        carnetIdentidad: usuario.carnetIdentidad.trim(),
        correo: usuario.correo.trim(),
        celular: usuario.celular?.trim() || "",
        carrera: usuario.carrera?.trim() || "",
        codigoSis: usuario.codigoSis?.trim() || null,
        activo: usuario.activo,
        idRol: Number(usuario.idRol),
        idsMaterias: materiasSeleccionadas,
      };

      await modificarUsuario(id, datosModificar);

      setMensaje("Usuario modificado correctamente");

      setTimeout(() => {
        navigate("/usuarios");
      }, 1200);
    } catch (error) {
      console.error("Error modificando usuario:", error);

      setError(
            error.response?.data?.mensaje ||
            error.response?.data?.message ||
           "No se pudo modificar el usuario"
      );
    } finally {
      setGuardando(false);
    }
  };

  if (!usuario) {
    return <div className="editar-cargando">Cargando...</div>;
  }

  return (
    <div className="editar-container">
      <div className="editar-contenido">
        <div className="editar-migas">
          Inicio
          <span>›</span>
          Usuarios
          <span>›</span>
          Modificar usuario
        </div>

        <div className="editar-titulo">
          <h1>Modificar usuario</h1>

          <p>
            Actualice la información personal, académica y de acceso del
            usuario.
          </p>
        </div>

        <section className="editar-resumen">
          <div className="editar-avatar">
            {usuario.nombre ? usuario.nombre.charAt(0).toUpperCase() : "U"}
          </div>

          <div className="editar-resumen-info">
            <h2>
              {usuario.nombre} {usuario.apellido}
            </h2>

            <span
              className={
                usuario.activo
                  ? "editar-estado activo"
                  : "editar-estado inactivo"
              }
            >
              {usuario.activo ? "Activo" : "Inactivo"}
            </span>

            <p>Información del usuario</p>
          </div>
        </section>

        {error && <div className="editar-mensaje mensaje-error">{error}</div>}

        {mensaje && (
          <div className="editar-mensaje mensaje-exito">{mensaje}</div>
        )}

        <form className="editar-form" onSubmit={guardar}>
          <section className="editar-panel">
            <h3>Información personal</h3>

            <div className="editar-grid">
              <div className="editar-campo">
                <label>
                  Nombre <span>*</span>
                </label>

                <input
                  value={usuario.nombre}
                  onChange={(e) => actualizarCampo("nombre", e.target.value)}
                />
              </div>

              <div className="editar-campo">
                <label>
                  Apellidos <span>*</span>
                </label>

                <input
                  value={usuario.apellido}
                  onChange={(e) => actualizarCampo("apellido", e.target.value)}
                />
              </div>

              <div className="editar-campo">
                <label>
                  Documento de identidad
                  <span>*</span>
                </label>

                <input
                  value={usuario.carnetIdentidad}
                  onChange={(e) =>
                    actualizarCampo("carnetIdentidad", e.target.value)
                  }
                  placeholder="Ingrese el C.I."
                />
              </div>

              <div className="editar-campo">
                <label>
                  Correo electrónico
                  <span>*</span>
                </label>

                <input
                  type="email"
                  value={usuario.correo}
                  onChange={(e) => actualizarCampo("correo", e.target.value)}
                />
              </div>

              <div className="editar-campo">
                <label>Teléfono</label>

                <input
                         value={usuario.celular}
                         onChange={(e) =>
                         actualizarCampo(
                            "celular",
                         e.target.value.replace(/\D/g, "")
                        )
                        }
                           inputMode="numeric"
                           placeholder="Ingrese el teléfono"
                 />
                </div>

                <div className="editar-campo">
                   <label>Carrera</label>

                <input
                  value={usuario.carrera}
                  onChange={(e) => actualizarCampo("carrera", e.target.value)}
                  placeholder="Ingrese la carrera"
                />
              </div>
            </div>
          </section>

          <section className="editar-panel">
            <h3>Información de acceso</h3>

            <div className="editar-grid">
              <div className="editar-campo">
                <label>Rol</label>

                <div className="editar-solo-lectura">
                  {roles.find((rol) => rol.idRol === Number(usuario.idRol))
                    ?.nombreRol || "Sin rol"}
                </div>
              </div>

              <div className="editar-campo">
                <label>
                  Estado <span>*</span>
                </label>

                <select
                  value={String(usuario.activo)}
                  onChange={(e) =>
                    actualizarCampo("activo", e.target.value === "true")
                  }
                >
                  <option value="true">Activo</option>

                  <option value="false">Inactivo</option>
                </select>
              </div>
            </div>
          </section>

          <section
            className="
                            editar-panel
                            editar-panel-academico
                        "
          >
            <h3>Información académica</h3>

            <div className="editar-grid">
              <div className="editar-campo">
                <label>Código universitario</label>

                <div className="editar-solo-lectura">
                  {usuario.codigoSis || "Sin código universitario"}
                </div>
              </div>
            </div>

            <div className="editar-materias">
              <div className="editar-materias-titulo">Materias y grupos</div>

              {materiasDisponibles.length === 0 ? (
                <div className="editar-sin-materias">
                  No existen materias registradas.
                </div>
              ) : (
                <div className="editar-tabla-materias">
                  {materiasDisponibles.map((materia) => (
                    <label
                      className="
                                                            editar-materia-fila
                                                        "
                      key={materia.idMateria}
                    >
                      <input
                        type="checkbox"
                        checked={materiasSeleccionadas.includes(
                          materia.idMateria,
                        )}
                        onChange={() => cambiarMateria(materia.idMateria)}
                      />

                      <span>{materia.nombreMateria}</span>

                      <strong>Grupo {materia.grupo}</strong>
                    </label>
                  ))}
                </div>
              )}

              <p className="editar-ayuda-materias">
                Seleccione las materias que desea asignar al usuario.
              </p>
            </div>
          </section>

          <div className="editar-acciones">
            <button
              type="button"
              className="editar-boton-cancelar"
              onClick={() => navigate("/usuarios")}
              disabled={guardando}
            >
              ← Cancelar
            </button>

            <button
               type="submit"
               className="editar-boton-guardar"
               disabled={
               guardando ||
               !hayCambios()
             }
              >
                {guardando
                   ? "Guardando..."
                  : "✓ Guardar cambios"
                }
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditarUsuario;
