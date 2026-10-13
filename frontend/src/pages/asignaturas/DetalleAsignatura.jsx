import { useEffect, useMemo, useState } from "react";
import { FiBookOpen, FiX } from "react-icons/fi";

import { obtenerFacultades } from "../../services/catalogoService";
import { obtenerGruposPorAsignatura } from "../../services/asignaturaService";

import "./DetalleAsignatura.css";

function DetalleAsignatura({ asignatura, onCerrar }) {
  const [facultades, setFacultades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCatalogo, setErrorCatalogo] = useState("");
  const [grupos, setGrupos] = useState([]);
  const [cargandoGrupos, setCargandoGrupos] = useState(true);
  const [errorGrupos, setErrorGrupos] = useState("");

  useEffect(() => {
    if (!asignatura) return;

    let activo = true;

    const cargarFacultades = async () => {
      try {
        setCargando(true);
        setErrorCatalogo("");

        const respuesta = await obtenerFacultades();

        if (!activo) return;

        setFacultades(
          Array.isArray(respuesta.data) ? respuesta.data : []
        );
      } catch (error) {
        console.error("Error cargando facultades:", error);

        if (activo) {
          setErrorCatalogo(
            "No se pudieron cargar las facultades."
          );
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    };

    cargarFacultades();

    return () => {
      activo = false;
    };
  }, [asignatura]);

  useEffect(() => {
    if (!asignatura?.idAsignatura) {
      setGrupos([]);
      setCargandoGrupos(false);
      return;
    }

    let activo = true;

    const cargarGrupos = async () => {
      setCargandoGrupos(true);
      setErrorGrupos("");
      setGrupos([]);

      try {
        const respuesta = await obtenerGruposPorAsignatura(
          asignatura.idAsignatura
        );

        if (!activo) return;

        setGrupos(
          Array.isArray(respuesta.data) ? respuesta.data : []
        );
      } catch (error) {
        console.error("Error cargando grupos:", error);

        if (activo) {
          setErrorGrupos(
            "No se pudieron cargar los grupos y docentes."
          );
        }
      } finally {
        if (activo) {
          setCargandoGrupos(false);
        }
      }
    };

    cargarGrupos();

    return () => {
      activo = false;
    };
  }, [asignatura?.idAsignatura]);


  const gruposFacultades = useMemo(() => {
    const carrerasAsignatura = asignatura?.carreras || [];
    const grupos = [];
    const encontradas = new Set();

    const normalizar = (valor) =>
      (valor || "").trim().toLocaleLowerCase("es");

    facultades.forEach((facultad) => {
      const carrerasCoincidentes = (facultad.carreras || [])
        .filter((carrera) =>
          carrerasAsignatura.some(
            (nombre) =>
              normalizar(nombre) === normalizar(carrera.nombre)
          )
        )
        .map((carrera) => carrera.nombre);

      if (carrerasCoincidentes.length > 0) {
        grupos.push({
          idFacultad: facultad.idFacultad,
          nombre: facultad.nombre,
          carreras: carrerasCoincidentes,
        });

        carrerasCoincidentes.forEach((nombre) =>
          encontradas.add(normalizar(nombre))
        );
      }
    });

    const carrerasSinFacultad = carrerasAsignatura.filter(
      (nombre) => !encontradas.has(normalizar(nombre))
    );

    return { grupos, carrerasSinFacultad };
  }, [facultades, asignatura]);

  if (!asignatura) {
    return null;
  }

  return (
    <div className="detalle-asignatura-fondo">
      <div
        className="detalle-asignatura-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalle-asignatura-titulo"
      >
        <header className="detalle-asignatura-encabezado">
          <div>
            <h2 id="detalle-asignatura-titulo">
              <FiBookOpen />
              Detalle de asignatura
            </h2>
            <p>Información de la asignatura registrada.</p>
          </div>

          <button
            type="button"
            className="detalle-asignatura-cerrar"
            aria-label="Cerrar detalles"
            onClick={onCerrar}
          >
            <FiX />
          </button>
        </header>

        <section className="detalle-asignatura-contenido">
          <div className="detalle-asignatura-campo">
            <span>Nombre de la asignatura</span>
            <strong>{asignatura.nombreAsignatura}</strong>
          </div>

          <div className="detalle-asignatura-grid">
            <div className="detalle-asignatura-campo">
              <span>Código</span>
              <strong>{asignatura.codigoAsignatura}</strong>
            </div>

            <div className="detalle-asignatura-campo">
              <span>Semestre</span>
              <strong>{asignatura.semestre}</strong>
            </div>

            <div className="detalle-asignatura-campo">
              <span>Estado</span>
              <div>
                <span
                  className={
                    asignatura.activo
                      ? "detalle-asignatura-estado activa"
                      : "detalle-asignatura-estado inactiva"
                  }
                >
                  {asignatura.activo ? "Activa" : "Inactiva"}
                </span>
              </div>
            </div>
          </div>

          <div className="detalle-asignatura-campo">
            <span>Facultades y carreras asociadas</span>

            {cargando ? (
              <p className="detalle-asignatura-mensaje">
                Cargando facultades y carreras...
              </p>
            ) : errorCatalogo ? (
              <>
                <p className="detalle-asignatura-mensaje">
                  {errorCatalogo}
                </p>

                <div className="detalle-asignatura-carreras">
                  {(asignatura.carreras || []).map((carrera) => (
                    <span key={carrera}>{carrera}</span>
                  ))}
                </div>
              </>
            ) : (
              <div className="detalle-asignatura-facultades">
                {gruposFacultades.grupos.map((facultad) => (
                  <div
                    key={facultad.idFacultad}
                    className="detalle-asignatura-facultad"
                  >
                    <strong>{facultad.nombre}</strong>

                    <div className="detalle-asignatura-carreras">
                      {facultad.carreras.map((carrera) => (
                        <span key={carrera}>{carrera}</span>
                      ))}
                    </div>
                  </div>
                ))}

                {gruposFacultades.carrerasSinFacultad.length > 0 && (
                  <div className="detalle-asignatura-facultad">
                    <strong>Carreras sin facultad identificada</strong>

                    <div className="detalle-asignatura-carreras">
                      {gruposFacultades.carrerasSinFacultad.map(
                        (carrera) => (
                          <span key={carrera}>{carrera}</span>
                        )
                      )}
                    </div>
                  </div>
                )}

                {(!asignatura.carreras ||
                  asignatura.carreras.length === 0) && (
                  <p className="detalle-asignatura-mensaje">
                    No tiene carreras asociadas.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="detalle-asignatura-campo">
            <span>Descripción</span>
            <p className="detalle-asignatura-descripcion">
              {asignatura.descripcion || "Sin descripción registrada."}
            </p>
          </div>
          
          <div className="detalle-asignatura-campo">
            <span>Grupos y docentes asignados</span>

            {cargandoGrupos ? (
              <p className="detalle-asignatura-mensaje">
                Cargando grupos y docentes...
              </p>
            ) : errorGrupos ? (
              <p className="detalle-asignatura-error" role="alert">
                {errorGrupos}
              </p>
            ) : grupos.length === 0 ? (
              <p className="detalle-asignatura-mensaje">
                Esta asignatura todavía no tiene grupos ni docentes asignados.
              </p>
            ) : (
              <div className="detalle-asignatura-tabla-contenedor">
                <table className="detalle-asignatura-tabla">
                  <thead>
                    <tr>
                      <th>Grupo</th>
                      <th>Docente responsable</th>
                    </tr>
                  </thead>

                  <tbody>
                    {grupos.map((grupo) => (
                      <tr key={grupo.idMateria}>
                        <td>
                          <span className="detalle-asignatura-grupo">
                            {grupo.grupo}
                          </span>
                        </td>

                        <td>{grupo.nombreDocente}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </section>

        <footer className="detalle-asignatura-acciones">
          <button type="button" onClick={onCerrar}>
            Cerrar
          </button>
        </footer>
      </div>
    </div>
  );
}

export default DetalleAsignatura;