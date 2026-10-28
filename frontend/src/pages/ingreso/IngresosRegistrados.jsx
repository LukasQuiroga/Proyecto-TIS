import { useEffect, useMemo, useState } from "react";
import { FiCalendar, FiEye, FiFileText, FiFilter, FiSearch } from "react-icons/fi";
import { obtenerExamenesIngreso } from "../../services/validacionHabilitacionService";
import { listarIngresosRegistrados } from "../../services/validacionHabilitacionService";
import "./IngresosRegistrados.css";

function IngresosRegistrados() {
  const [examenes, setExamenes] = useState([]);
  const [ingresos, setIngresos] = useState([]);
  const [q, setQ] = useState("");
  const [idExamen, setIdExamen] = useState("");
  const [fecha, setFecha] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [pagina, setPagina] = useState(1);
  const porPagina = 5;

  useEffect(() => {
    let activo = true;
    obtenerExamenesIngreso()
      .then((datos) => {
        if (activo) setExamenes(datos || []);
      })
      .catch(() => {
        if (activo) setError("No se pudieron cargar los exámenes.");
      });
    return () => {
      activo = false;
    };
  }, []);

  const cargar = async () => {
    setCargando(true);
    setError("");
    try {
      const datos = await listarIngresosRegistrados({ q, idExamen, fecha });
      setIngresos(Array.isArray(datos) ? datos : []);
      setPagina(1);
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          err.response?.data?.message ||
          "No se pudieron cargar los ingresos registrados."
      );
      setIngresos([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatearId = (id) => {
    if (!id) return "-";
    return `IG-${String(id).padStart(3, "0")}`;
  };

  const formatearFecha = (valor) => {
    if (!valor) return "-";
    try {
      const fechaObj = new Date(valor);
      const dia = String(fechaObj.getDate()).padStart(2, "0");
      const mes = String(fechaObj.getMonth() + 1).padStart(2, "0");
      const anio = fechaObj.getFullYear();
      return `${dia}/${mes}/${anio}`;
    } catch {
      return "-";
    }
  };

  const formatearHora = (valor) => {
    if (!valor) return "-";
    try {
      const fechaObj = new Date(valor);
      const horas = String(fechaObj.getHours()).padStart(2, "0");
      const minutos = String(fechaObj.getMinutes()).padStart(2, "0");
      const segundos = String(fechaObj.getSeconds()).padStart(2, "0");
      return `${horas}:${minutos}:${segundos}`;
    } catch {
      return "-";
    }
  };

  const total = ingresos.length;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * porPagina;
  const datosPagina = ingresos.slice(inicio, inicio + porPagina);

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
    setPagina(nuevaPagina);
  };

  const paginas = useMemo(() => {
    const arr = [];
    for (let i = 1; i <= totalPaginas; i++) {
      arr.push(i);
    }
    return arr;
  }, [totalPaginas]);

  return (
    <main className="ingresos-registrados-pagina">
      <header className="ingresos-registrados-encabezado">
        <h1>Ingresos registrados</h1>
        <p>Consulte la fecha y hora de los ingresos autorizados de los estudiantes.</p>
      </header>

      <section className="ingresos-registrados-contenedor">
        <div className="ingresos-registrados-filtros">
          <div className="ingresos-registrados-buscador">
            <FiSearch className="ingresos-registrados-buscador-icono" />
            <input
              type="text"
              placeholder="Buscar estudiante por código o nombre..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="ingresos-registrados-campo">
            <label>Examen</label>
            <select value={idExamen} onChange={(e) => setIdExamen(e.target.value)} style={{ direction: "ltr" }}>
              <option value="">Todos</option>
              {examenes.map((examen) => (
                <option key={examen.idExamen} value={examen.idExamen} style={{ direction: "ltr" }}>
                  {examen.codigo && examen.nombreExamen
                    ? `${examen.codigo} - ${examen.nombreExamen}`
                    : examen.nombreExamen || examen.codigo}
                </option>
              ))}
            </select>
          </div>

          <div className="ingresos-registrados-campo">
            <label>Fecha</label>
            <div className="ingresos-registrados-fecha-wrapper">
              <FiCalendar className="ingresos-registrados-fecha-icono" />
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                placeholder="Seleccionar fecha"
              />
            </div>
          </div>

          <button type="button" className="ingresos-registrados-boton-filtrar" onClick={cargar}>
            <FiFilter />
            <span>Filtrar</span>
          </button>
        </div>

        <div className="ingresos-registrados-mensaje">
          <div className="ingresos-registrados-mensaje-icono">
            <FiFileText />
          </div>
          <span>
            {cargando
              ? "Cargando ingresos registrados..."
              : error
                ? error
                : `Se encontraron ${total} ingreso${total === 1 ? "" : "s"} registrado${total === 1 ? "" : "s"}.`}
          </span>
        </div>

        <div className="ingresos-registrados-tabla-contenedor">
          <table className="ingresos-registrados-tabla">
            <thead>
              <tr>
                <th>ID</th>
                <th>Código</th>
                <th>Estudiante</th>
                <th>Examen</th>
                <th>Ambiente</th>
                <th>Fecha de ingreso</th>
                <th>Hora de ingreso</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {datosPagina.map((ingreso, index) => (
                <tr key={ingreso.idIngreso || index}>
                  <td>{formatearId(ingreso.idIngreso)}</td>
                  <td>{ingreso.codigoUniversitario || "-"}</td>
                  <td className="ingresos-registrados-estudiante">{ingreso.nombreEstudiante || "-"}</td>
                  <td>{ingreso.nombreExamen || "-"}</td>
                  <td>{ingreso.ambiente || "-"}</td>
                  <td>{formatearFecha(ingreso.fechaHoraIngreso)}</td>
                  <td>{formatearHora(ingreso.fechaHoraIngreso)}</td>
                  <td>
                    <span className="ingresos-registrados-estado">Registrado</span>
                  </td>
                  <td>
                    <button type="button" className="ingresos-registrados-boton-ver">
                      <FiEye />
                      <span>Ver</span>
                    </button>
                  </td>
                </tr>
              ))}
              {!cargando && datosPagina.length === 0 && (
                <tr>
                  <td colSpan="9" className="ingresos-registrados-sin-resultados">
                    No hay ingresos registrados para los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="ingresos-registrados-paginacion">
          <div className="ingresos-registrados-paginacion-info">
            Mostrando {datosPagina.length === 0 ? 0 : inicio + 1} - {Math.min(inicio + porPagina, total)} de {total} ingresos registrados
          </div>
          <div className="ingresos-registrados-paginacion-controles">
            <button
              type="button"
              className="ingresos-registrados-paginacion-boton"
              onClick={() => cambiarPagina(paginaActual - 1)}
              disabled={paginaActual === 1}
            >
              ‹
            </button>
            {paginas.map((num) => (
              <button
                key={num}
                type="button"
                className={`ingresos-registrados-paginacion-boton ${num === paginaActual ? "activa" : ""}`}
                onClick={() => cambiarPagina(num)}
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              className="ingresos-registrados-paginacion-boton"
              onClick={() => cambiarPagina(paginaActual + 1)}
              disabled={paginaActual === totalPaginas}
            >
              ›
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default IngresosRegistrados;
