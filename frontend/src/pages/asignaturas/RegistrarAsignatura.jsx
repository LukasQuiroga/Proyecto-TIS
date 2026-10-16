import { useEffect, useMemo, useState } from "react";
import { FiPlus, FiX } from "react-icons/fi";

import { obtenerFacultades } from "../../services/catalogoService";
import {
  registrarAsignatura,
  obtenerDocentesActivos,
} from "../../services/asignaturaService";
import "./RegistrarAsignatura.css";

const DATOS_INICIALES = {
  codigoAsignatura: "",
  nombreAsignatura: "",
  semestre: "",
  activo: true,
  descripcion: "",
  carreras: [],
  idDocente: "",
  grupo: "",
};

const limpiarBusqueda = (valor) =>
  valor.replace(/[^\p{L}\p{M}\s'-]/gu, "");


function RegistrarAsignatura({ onCerrar, onExito }) {
  const [datos, setDatos] = useState(DATOS_INICIALES);
  const [busquedaCarrera, setBusquedaCarrera] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [facultades, setFacultades] = useState([]);
  const [facultadSeleccionada, setFacultadSeleccionada] = useState("");
  const [cargandoFacultades, setCargandoFacultades] = useState(true);
  const [errorCatalogo, setErrorCatalogo] = useState("");
  const [docentesFacultad, setDocentesFacultad] = useState([]);
  const [docentesSinFacultad, setDocentesSinFacultad] = useState([]);
  const [busquedaDocente, setBusquedaDocente] = useState("");
  const [cargandoDocentes, setCargandoDocentes] = useState(false);
  const [errorDocentes, setErrorDocentes] = useState("");

  const carrerasFiltradas = useMemo(() => {
    const facultad = facultades.find(
      (item) => String(item.idFacultad) === facultadSeleccionada,
    );

    if (!facultad) return [];

    return (facultad.carreras || []).filter((carrera) =>
      carrera.nombre
        .toLocaleLowerCase("es")
        .includes(busquedaCarrera.toLocaleLowerCase("es")),
    );
  }, [facultades, facultadSeleccionada, busquedaCarrera]);

  const filtrarDocentes = (lista) => {
    const texto = busquedaDocente.trim().toLocaleLowerCase("es");

    return lista.filter((docente) =>
      docente.nombreCompleto.toLocaleLowerCase("es").includes(texto),
    );
  };

  const docentesFacultadFiltrados = filtrarDocentes(docentesFacultad);
  const docentesSinFacultadFiltrados = filtrarDocentes(docentesSinFacultad);

  const docentes = [...docentesFacultad, ...docentesSinFacultad];

  useEffect(() => {
    let activo = true;

    const cargarFacultades = async () => {
      try {
        setCargandoFacultades(true);
        setErrorCatalogo("");

        const respuesta = await obtenerFacultades();

        if (!activo) return;

        const datos = Array.isArray(respuesta.data)
          ? respuesta.data
          : [];

        setFacultades(datos);
      } catch (error) {
        console.error("Error cargando facultades:", error);

        if (activo) {
          setErrorCatalogo(
            "No se pudieron cargar las facultades y carreras.",
          );
        }
      } finally {
        if (activo) {
          setCargandoFacultades(false);
        }
      }
    };

    cargarFacultades();

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (!facultadSeleccionada) return;

    let activo = true;

    const cargarDocentes = async () => {
      try {
        const respuesta = await obtenerDocentesActivos(
          Number(facultadSeleccionada),
        );

        if (!activo) return;

        setDocentesFacultad(respuesta.data.docentesFacultad || []);
        setDocentesSinFacultad(respuesta.data.docentesSinFacultad || []);
        setErrorDocentes("");
      } catch (error) {
        console.error("Error cargando docentes:", error);

        if (activo) {
          setErrorDocentes("No se pudieron cargar los docentes disponibles.");
        }
      } finally {
        if (activo) {
          setCargandoDocentes(false);
        }
      }
    };

    cargarDocentes();

    return () => {
      activo = false;
    };
  }, [facultadSeleccionada]);

  const actualizarCampo = (campo, valor) => {
    setDatos((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  };

  const cambiarCarrera = (carrera) => {
    setDatos((anterior) => ({
      ...anterior,
      carreras: anterior.carreras.includes(carrera)
        ? anterior.carreras.filter((item) => item !== carrera)
        : [...anterior.carreras, carrera],
    }));
  };

  const manejarRegistro = async (evento) => {
    evento.preventDefault();
    setError("");

    const codigo = datos.codigoAsignatura.trim();
    const nombre = datos.nombreAsignatura.trim();

    if (!codigo || !/^[A-Za-z0-9_-]+$/.test(codigo)) {
      setError("Ingresa un código válido, usando letras, números, - o _.");
      return;
    }

    if (nombre.length < 3 || nombre.length > 120) {
      setError("El nombre debe contener entre 3 y 120 caracteres.");
      return;
    }

    if (datos.carreras.length === 0) {
      setError("Debes seleccionar al menos una carrera.");
      return;
    }

    if (!datos.semestre) {
      setError("Debes seleccionar un semestre.");
      return;
    }

    setGuardando(true);

    try {
      const respuesta = await registrarAsignatura({
        codigoAsignatura: codigo,
        nombreAsignatura: nombre,
        semestre: Number(datos.semestre),
        activo: datos.activo,
        descripcion: datos.descripcion.trim(),
        idFacultad: Number(facultadSeleccionada),
        carreras: datos.carreras,
        idDocente: Number(datos.idDocente),
        grupo: datos.grupo.trim().toUpperCase(),
      });

      if (respuesta.status === 201) {
        onExito(respuesta.data);
      }
    } catch (err) {
      console.error("Error registrando asignatura:", err);

      const mensaje = err.response?.data?.mensaje;

      setError(
        typeof mensaje === "string"
          ? mensaje
          : "No se pudo registrar la asignatura. Verifica los datos e intenta nuevamente.",
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="registro-asignatura-fondo">
      <div
        className="registro-asignatura-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="registro-asignatura-titulo"
      >
        <header className="registro-asignatura-encabezado">
          <div>
            <h2 id="registro-asignatura-titulo">
              Registrar asignatura
            </h2>
            <p>Completa los datos de la nueva asignatura.</p>
          </div>

          <button
            type="button"
            className="registro-asignatura-cerrar"
            aria-label="Cerrar formulario"
            onClick={onCerrar}
            disabled={guardando}
          >
            <FiX />
          </button>
        </header>

        <form onSubmit={manejarRegistro}>
          <div className="registro-asignatura-campos">
            <div className="registro-asignatura-campo">
              <label htmlFor="asignatura-codigo">
                Código *
              </label>
              <input
                id="asignatura-codigo"
                value={datos.codigoAsignatura}
                onChange={(e) =>
                  actualizarCampo(
                    "codigoAsignatura",
                    e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""),
                  )
                }
                placeholder="Ej. INF-101"
                maxLength={30}
                required
                disabled={guardando}
              />
            </div>

            <div className="registro-asignatura-campo">
              <label htmlFor="asignatura-semestre">
                Semestre *
              </label>
              <select
                id="asignatura-semestre"
                value={datos.semestre}
                onChange={(e) =>
                  actualizarCampo("semestre", e.target.value)
                }
                required
                disabled={guardando}
              >
                <option value="">Seleccionar semestre</option>
                {Array.from({ length: 10 }, (_, indice) => indice + 1).map(
                  (numero) => (
                    <option key={numero} value={numero}>
                      {numero}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>

          <div className="registro-asignatura-campo">
            <label htmlFor="asignatura-nombre">
              Nombre de la asignatura *
            </label>
            <input
              id="asignatura-nombre"
              value={datos.nombreAsignatura}
              onChange={(e) =>
                actualizarCampo(
                  "nombreAsignatura",
                  e.target.value.replace(/[^\p{L}\p{M}\p{N}\s]/gu, ""),
                )
              }
              placeholder="Ej. Programación I"
              minLength={3}
              maxLength={120}
              required
              disabled={guardando}
            />
          </div>

          <div className="registro-asignatura-campo">
            <label htmlFor="asignatura-facultad">
              Facultad *
            </label>

            <select
              id="asignatura-facultad"
              value={facultadSeleccionada}
              onChange={(e) => {
                setFacultadSeleccionada(e.target.value);
                setDocentesFacultad([]);
                setDocentesSinFacultad([]);
                setBusquedaDocente("");
                setErrorDocentes("");
                setCargandoDocentes(Boolean(e.target.value));
                setBusquedaCarrera("");
                setDatos((anterior) => ({
                  ...anterior,
                  carreras: [],
                  idDocente: "",
                  grupo: "",
                }));
              }}
              disabled={guardando || cargandoFacultades}
              required
            >
              <option value="">Seleccionar facultad</option>

              {facultades.map((facultad) => (
                <option
                  key={facultad.idFacultad}
                  value={facultad.idFacultad}
                >
                  {facultad.nombre}
                </option>
              ))}
            </select>
          </div>    
      
          <fieldset className="registro-asignatura-carreras">
            <legend>Carreras asociadas *</legend>

            <input
              type="search"
              aria-label="Buscar carrera"
              placeholder="Buscar carrera..."
              value={busquedaCarrera}
              onChange={(e) =>
                setBusquedaCarrera(limpiarBusqueda(e.target.value))
              }
              disabled={guardando}
            />

            <div className="registro-asignatura-lista-carreras">
              {carrerasFiltradas.map((carrera) => (
                <label key={carrera.idCarrera}>
                  <input
                    type="checkbox"
                    checked={datos.carreras.includes(carrera.nombre)}
                    onChange={() => cambiarCarrera(carrera.nombre)}
                    disabled={guardando}
                  />

                  <span>{carrera.nombre}</span>
                </label>
              ))}

              {!cargandoFacultades && carrerasFiltradas.length === 0 && (
                <p>
                  {facultadSeleccionada
                    ? "No se encontraron carreras."
                    : "Selecciona una facultad para ver sus carreras."}
                </p>
              )}
            </div>

            <small>
              {datos.carreras.length} carrera(s) seleccionada(s)
            </small>
          </fieldset>

          <div className="registro-asignatura-campo">
            <label htmlFor="asignatura-docente">
              Docente responsable *
            </label>

            <input
              id="asignatura-docente"
              type="search"
              placeholder="Buscar docente por nombre o apellido..."
              value={busquedaDocente}
              onChange={(e) => {
                setBusquedaDocente(limpiarBusqueda(e.target.value));
                actualizarCampo("idDocente", "");
              }}
              disabled={guardando || cargandoDocentes || Boolean(errorDocentes)}
              autoComplete="off"
            />

            <div className="registro-asignatura-lista-docentes">
              {!facultadSeleccionada ? (
                <p>Selecciona una facultad para ver los docentes.</p>
              ) : cargandoDocentes ? (
                <p>Cargando docentes...</p>
              ) : (
                <>
                  <strong>Docentes de la facultad</strong>

                  {docentesFacultadFiltrados.length === 0 ? (
                    <p>No se encontraron docentes de esta facultad.</p>
                  ) : (
                    docentesFacultadFiltrados.map((docente) => (
                      <label key={docente.idUsuario}>
                        <input
                          type="radio"
                          name="docenteAsignatura"
                          value={docente.idUsuario}
                          checked={String(datos.idDocente) === String(docente.idUsuario)}
                          onChange={() =>
                            actualizarCampo("idDocente", String(docente.idUsuario))
                          }
                          disabled={guardando}
                        />
                        <span>{docente.nombreCompleto}</span>
                      </label>
                    ))
                  )}

                  <strong className="registro-asignatura-separador-docentes">
                    Docentes sin facultad
                  </strong>

                  {docentesSinFacultadFiltrados.length === 0 ? (
                    <p>No se encontraron docentes sin facultad.</p>
                  ) : (
                    docentesSinFacultadFiltrados.map((docente) => (
                      <label key={docente.idUsuario}>
                        <input
                          type="radio"
                          name="docenteAsignatura"
                          value={docente.idUsuario}
                          checked={String(datos.idDocente) === String(docente.idUsuario)}
                          onChange={() =>
                            actualizarCampo("idDocente", String(docente.idUsuario))
                          }
                          disabled={guardando}
                        />
                        <span>{docente.nombreCompleto}</span>
                      </label>
                    ))
                  )}
                </>
              )}
            </div>

            {datos.idDocente && (
              <small>
                Docente seleccionado:{" "}
                {
                  docentes.find(
                    (docente) => String(docente.idUsuario) === String(datos.idDocente),
                  )?.nombreCompleto
                }
              </small>
            )}
          </div>

          <div className="registro-asignatura-campo">
            <label htmlFor="asignatura-grupo">
              Grupo *
            </label>
            
            <input
              id="asignatura-grupo"
              type="text"
              placeholder="Ej. 1A"
              value={datos.grupo}
              onChange={(e) =>
                actualizarCampo(
                  "grupo",
                  e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                )
              }
              maxLength={20}
              disabled={guardando}
              required
            />

            <small>Ejemplos: 1A, 1B, 2A.</small>
          </div>

          <div className="registro-asignatura-campo">
            <label htmlFor="asignatura-estado">
              Estado *
            </label>
            <select
              id="asignatura-estado"
              value={datos.activo ? "ACTIVA" : "INACTIVA"}
              onChange={(e) =>
                actualizarCampo("activo", e.target.value === "ACTIVA")
              }
              disabled={guardando}
            >
              <option value="ACTIVA">Activa</option>
              <option value="INACTIVA">Inactiva</option>
            </select>
          </div>

          <div className="registro-asignatura-campo">
            <label htmlFor="asignatura-descripcion">
              Descripción (opcional)
            </label>
            <textarea
              id="asignatura-descripcion"
              value={datos.descripcion}
              onChange={(e) =>
                actualizarCampo("descripcion", e.target.value)
              }
              placeholder="Descripción de la asignatura"
              rows={3}
              disabled={guardando}
            />
          </div>

          {errorCatalogo && (
            <div className="registro-asignatura-error" role="alert">
              {errorCatalogo}
            </div>
          )}

          {errorDocentes && (
            <div className="registro-asignatura-error" role="alert">
              {errorDocentes}
            </div>
          )}

          {error && (
            <div className="registro-asignatura-error" role="alert">
              {error}
            </div>
          )}

          <footer className="registro-asignatura-acciones">
            <button
              type="button"
              className="registro-asignatura-cancelar"
              onClick={onCerrar}
              disabled={guardando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="registro-asignatura-guardar"
              disabled={
                guardando ||
                cargandoFacultades ||
                cargandoDocentes ||
                Boolean(errorCatalogo) ||
                Boolean(errorDocentes) ||
                !datos.idDocente ||
                !datos.grupo.trim()
              }
            >
              <FiPlus />
              {guardando ? "Registrando..." : "Registrar asignatura"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

export default RegistrarAsignatura;