import { useEffect, useState } from "react";
import { FiCalendar, FiChevronDown, FiInfo, FiSearch } from "react-icons/fi";

import {
  consultarLogs,
  obtenerTiposLog,
  TAMANIO_PAGINA_AUDITORIA,
} from "../../services/logService";

import { obtenerRoles } from "../../services/rolService";

import "./HistorialUsuarios.css";

const FILTROS_VACIOS = {
  usuario: "",
  rol: "",
  accion: "",
  fechaDesde: "",
  fechaHasta: "",
};

const INTERVALO_ACTUALIZACION_MS = 5000;

const ESTILOS_ACCION = {
  CREAR: "au-badge-crear",
  ACTUALIZAR: "au-badge-actualizar",
  ELIMINAR: "au-badge-eliminar",
  INICIAR_SESION: "au-badge-iniciar-sesion",
  CERRAR_SESION: "au-badge-cerrar-sesion",
  CONSULTAR: "au-badge-consultar",
  CONFIGURAR: "au-badge-configurar",
};

function formatearFecha(valor) {
  if (!valor) {
    return "—";
  }

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return "—";
  }

  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const anio = fecha.getFullYear();
  const hora = String(fecha.getHours()).padStart(2, "0");
  const minuto = String(fecha.getMinutes()).padStart(2, "0");

  return `${dia}/${mes}/${anio} ${hora}:${minuto}`;
}

function formatearHora(valor) {
  if (!valor) {
    return "—";
  }

  return valor.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function clasificarAccion(tipoAccion) {
  const accion = (tipoAccion || "").trim().toUpperCase();

  if (ESTILOS_ACCION[accion]) {
    return ESTILOS_ACCION[accion];
  }

  if (accion.includes("REGISTRAR") || accion.includes("CREAR")) {
    return ESTILOS_ACCION.CREAR;
  }

  if (accion.includes("MODIFICAR") || accion.includes("ACTUALIZAR")) {
    return ESTILOS_ACCION.ACTUALIZAR;
  }

  if (accion.includes("ELIMINAR") || accion.includes("ANULAR")) {
    return ESTILOS_ACCION.ELIMINAR;
  }

  if (accion.includes("INICIAR_SESION") || accion.includes("INICIAR SESI")) {
    return ESTILOS_ACCION.INICIAR_SESION;
  }

  if (accion.includes("CERRAR_SESION") || accion.includes("CERRAR SESI")) {
    return ESTILOS_ACCION.CERRAR_SESION;
  }

  if (accion.includes("CONSULTAR")) {
    return ESTILOS_ACCION.CONSULTAR;
  }

  if (accion.includes("CONFIGURAR") || accion.includes("ASIGNAR")) {
    return ESTILOS_ACCION.CONFIGURAR;
  }

  return "au-badge-general";
}

function obtenerPaginas(paginaActual, totalPaginas) {
  if (totalPaginas <= 0) {
    return [];
  }

  if (totalPaginas <= 7) {
    return Array.from({ length: totalPaginas }, (_, indice) => indice);
  }

  const candidatas = new Set([
    0,
    1,
    totalPaginas - 2,
    totalPaginas - 1,
    paginaActual - 1,
    paginaActual,
    paginaActual + 1,
  ]);

  const paginas = [...candidatas]
    .filter((pagina) => pagina >= 0 && pagina < totalPaginas)
    .sort((a, b) => a - b);

  const resultado = [];

  paginas.forEach((pagina, indice) => {
    if (indice > 0 && pagina - paginas[indice - 1] > 1) {
      resultado.push(`separador-${pagina}`);
    }

    resultado.push(pagina);
  });

  return resultado;
}

function HistorialUsuarios() {
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [filtrosAplicados, setFiltrosAplicados] = useState(FILTROS_VACIOS);

  const [roles, setRoles] = useState([]);
  const [acciones, setAcciones] = useState([]);

  const [pagina, setPagina] = useState(0);
  const [reintento, setReintento] = useState(0);

  const [datos, setDatos] = useState({
    logs: [],
    total: 0,
    pagina: 0,
    tamanio: TAMANIO_PAGINA_AUDITORIA,
    totalPaginas: 0,
  });

  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    obtenerRoles()
      .then((respuesta) => {
        if (!activo) {
          return;
        }

        setRoles(Array.isArray(respuesta.data) ? respuesta.data : []);
      })
      .catch(() => {
        if (activo) {
          setRoles([]);
        }
      });

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    let activo = true;

    function cargarTipos() {
      obtenerTiposLog()
        .then((tipos) => {
          if (activo) {
            setAcciones(Array.isArray(tipos) ? tipos : []);
          }
        })
        .catch(() => {
          if (activo) {
            setAcciones([]);
          }
        });
    }

    cargarTipos();

    const intervalo = setInterval(() => {
      if (document.visibilityState === "visible") {
        cargarTipos();
      }
    }, INTERVALO_ACTUALIZACION_MS);

    return () => {
      activo = false;
      clearInterval(intervalo);
    };
  }, []);

  useEffect(() => {
    let activo = true;
    let enCurso = false;

    function cargar({ silencioso = false } = {}) {
      if (!activo || enCurso) {
        return;
      }

      enCurso = true;

      if (silencioso) {
        setActualizando(true);
      } else {
        setCargando(true);
      }

      consultarLogs({
        usuario: filtrosAplicados.usuario,
        rol: filtrosAplicados.rol,
        tipoAccion: filtrosAplicados.accion,
        fechaDesde: filtrosAplicados.fechaDesde,
        fechaHasta: filtrosAplicados.fechaHasta,
        pagina,
        tamanio: TAMANIO_PAGINA_AUDITORIA,
      })
        .then((respuesta) => {
          if (!activo) {
            return;
          }

          setDatos(respuesta);
          setUltimaActualizacion(new Date());
          setError("");
        })
        .catch((excepcion) => {
          if (!activo || silencioso) {
            return;
          }

          setDatos({
            logs: [],
            total: 0,
            pagina: 0,
            tamanio: TAMANIO_PAGINA_AUDITORIA,
            totalPaginas: 0,
          });

          setError(
            excepcion.response?.data?.mensaje
              || excepcion.message
              || "No se pudieron recuperar los registros de auditoría."
          );
        })
        .finally(() => {
          enCurso = false;

          if (activo) {
            setCargando(false);
            setActualizando(false);
          }
        });
    }

    cargar();

    const intervalo = setInterval(() => {
      if (document.visibilityState === "visible") {
        cargar({ silencioso: true });
      }
    }, INTERVALO_ACTUALIZACION_MS);

    function alCambiarVisibilidad() {
      if (document.visibilityState === "visible") {
        cargar({ silencioso: true });
      }
    }

    document.addEventListener("visibilitychange", alCambiarVisibilidad);

    return () => {
      activo = false;
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
    };
  }, [filtrosAplicados, pagina, reintento]);

  function actualizarFiltro(campo, valor) {
    setFiltros((actuales) => ({ ...actuales, [campo]: valor }));
  }

  function buscar(evento) {
    evento.preventDefault();

    if (
      filtros.fechaDesde
      && filtros.fechaHasta
      && filtros.fechaHasta < filtros.fechaDesde
    ) {
      setError("La fecha hasta no puede ser anterior a la fecha desde.");
      return;
    }

    setError("");
    setCargando(true);
    setPagina(0);
    setFiltrosAplicados({ ...filtros });
  }

  function limpiarFiltros() {
    setCargando(true);
    setError("");
    setFiltros(FILTROS_VACIOS);
    setPagina(0);
    setFiltrosAplicados({ ...FILTROS_VACIOS });
  }

  function reintentar() {
    setCargando(true);
    setReintento((valor) => valor + 1);
  }

  const paginaActual = datos.pagina ?? pagina;
  const paginas = obtenerPaginas(paginaActual, datos.totalPaginas);
  const registrosMostrados = datos.logs.length;

  return (
    <div className="au-pagina">
      <section className="au-aviso">
        <span className="au-aviso-icono">
          <FiInfo />
        </span>

        <p>
          Yo como administrador quiero consultar la auditoría de usuarios para
          determinar quién realizó cada acción relevante en el sistema.
        </p>
      </section>

      <header className="au-encabezado">
        <h1>Auditoría de usuarios</h1>

        <p>
          Consulte las operaciones realizadas por los usuarios del sistema.
        </p>
      </header>

      <section className="au-panel">
        <h2 className="au-panel-titulo">Filtros de búsqueda</h2>

        <form className="au-filtros" onSubmit={buscar}>
          <div className="au-campo">
            <label htmlFor="au-usuario">Usuario</label>

            <div className="au-busqueda">
              <FiSearch aria-hidden="true" />

              <input
                id="au-usuario"
                type="text"
                value={filtros.usuario}
                onChange={(evento) =>
                  actualizarFiltro("usuario", evento.target.value)
                }
                placeholder="Buscar por nombre de usuario..."
                autoComplete="off"
              />
            </div>
          </div>

          <div className="au-campo">
            <label htmlFor="au-rol">Rol</label>

            <div className="au-select">
              <select
                id="au-rol"
                value={filtros.rol}
                onChange={(evento) =>
                  actualizarFiltro("rol", evento.target.value)
                }
              >
                <option value="">Seleccione un rol...</option>

                {roles.map((rol) => (
                  <option key={rol.idRol} value={rol.nombreRol}>
                    {rol.nombreRol}
                  </option>
                ))}
              </select>

              <FiChevronDown aria-hidden="true" />
            </div>
          </div>

          <div className="au-campo">
            <label htmlFor="au-accion">Acción</label>

            <div className="au-select">
              <select
                id="au-accion"
                value={filtros.accion}
                onChange={(evento) =>
                  actualizarFiltro("accion", evento.target.value)
                }
              >
                <option value="">Seleccione una acción...</option>

                {acciones.map((accion) => (
                  <option key={accion} value={accion}>
                    {accion}
                  </option>
                ))}
              </select>

              <FiChevronDown aria-hidden="true" />
            </div>
          </div>

          <div className="au-campo">
            <label htmlFor="au-fecha-desde">Fecha desde</label>

            <div className="au-fecha">
              <input
                id="au-fecha-desde"
                type="date"
                value={filtros.fechaDesde}
                max={filtros.fechaHasta || undefined}
                onChange={(evento) =>
                  actualizarFiltro("fechaDesde", evento.target.value)
                }
              />

              <FiCalendar aria-hidden="true" />
            </div>
          </div>

          <div className="au-campo">
            <label htmlFor="au-fecha-hasta">Fecha hasta</label>

            <div className="au-fecha">
              <input
                id="au-fecha-hasta"
                type="date"
                value={filtros.fechaHasta}
                min={filtros.fechaDesde || undefined}
                onChange={(evento) =>
                  actualizarFiltro("fechaHasta", evento.target.value)
                }
              />

              <FiCalendar aria-hidden="true" />
            </div>
          </div>

          <div className="au-acciones">
            <button
              type="button"
              className="au-boton-secundario"
              onClick={limpiarFiltros}
            >
              Limpiar filtros
            </button>

            <button type="submit" className="au-boton-primario">
              Buscar
            </button>
          </div>
        </form>

        {error && (
          <div className="au-error" role="alert">
            <span>{error}</span>

            <button type="button" onClick={reintentar}>
              Reintentar
            </button>
          </div>
        )}
      </section>

      <section className="au-panel">
        <div className="au-resultados-cabecera">
          <h2 className="au-panel-titulo">Resultados de auditoría</h2>

          <div className="au-tiempo-real" aria-live="polite">
            <span
              className={`au-tiempo-real-punto ${
                actualizando ? "au-tiempo-real-punto-activo" : ""
              }`}
              aria-hidden="true"
            />

            <span className="au-tiempo-real-texto">
              {actualizando
                ? "Actualizando..."
                : ultimaActualizacion
                  ? `Actualizado a las ${formatearHora(ultimaActualizacion)}`
                  : "Actualización automática activa"}
            </span>

            <span className="au-tiempo-real-detalle">Cada 5 s</span>
          </div>
        </div>

        <div className="au-tabla-scroll">
          <table className="au-tabla">
            <colgroup>
              <col style={{ width: "4%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "33%" }} />
              <col style={{ width: "13%" }} />
            </colgroup>

            <thead>
              <tr>
                <th className="au-col-numero">#</th>
                <th>Fecha y hora</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Acción</th>
                <th>Descripción</th>
                <th>Módulo</th>
              </tr>
            </thead>

            <tbody>
              {cargando && (
                <tr>
                  <td colSpan={7} className="au-tabla-estado">
                    Cargando registros de auditoría...
                  </td>
                </tr>
              )}

              {!cargando && !error && datos.logs.length === 0 && (
                <tr>
                  <td colSpan={7} className="au-tabla-estado">
                    No se encontraron registros que coincidan con los filtros
                    aplicados.
                  </td>
                </tr>
              )}

              {!cargando
                && datos.logs.map((log, indice) => (
                  <tr key={log.idLog}>
                    <td className="au-col-numero">
                      {paginaActual * datos.tamanio + indice + 1}
                    </td>

                    <td>{formatearFecha(log.fecha)}</td>

                    <td>{log.nombreUsuario || "Sin usuario"}</td>

                    <td>{log.rol || "—"}</td>

                    <td>
                      <span
                        className={`au-badge ${clasificarAccion(log.tipoAccion)}`}
                      >
                        {log.tipoAccion}
                      </span>
                    </td>

                    <td className="au-col-descripcion">
                      {log.descripcion || "—"}
                    </td>

                    <td>{log.modulo || "General"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="au-paginacion">
          <span className="au-paginacion-resumen">
            Mostrando {registrosMostrados} de {datos.total} resultados
          </span>

          <div className="au-paginacion-controles">
            <button
              type="button"
              className="au-pagina-boton"
              onClick={() => {
                setCargando(true);
                setPagina((valor) => Math.max(0, valor - 1));
              }}
              disabled={paginaActual === 0 || cargando}
              aria-label="Página anterior"
            >
              ‹
            </button>

            {paginas.map((paginaNumero) =>
              typeof paginaNumero === "string" ? (
                <span key={paginaNumero} className="au-pagina-puntos">
                  …
                </span>
              ) : (
                <button
                  key={paginaNumero}
                  type="button"
                  className={`au-pagina-boton ${
                    paginaNumero === paginaActual ? "au-pagina-activa" : ""
                  }`}
                  onClick={() => {
                    if (paginaNumero === paginaActual) {
                      return;
                    }

                    setCargando(true);
                    setPagina(paginaNumero);
                  }}
                  disabled={cargando}
                  aria-label={`Página ${paginaNumero + 1}`}
                  aria-current={
                    paginaNumero === paginaActual ? "page" : undefined
                  }
                >
                  {paginaNumero + 1}
                </button>
              )
            )}

            <button
              type="button"
              className="au-pagina-boton"
              onClick={() => {
                setCargando(true);
                setPagina((valor) => valor + 1);
              }}
              disabled={
                cargando
                || datos.totalPaginas === 0
                || paginaActual + 1 >= datos.totalPaginas
              }
              aria-label="Página siguiente"
            >
              ›
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HistorialUsuarios;
