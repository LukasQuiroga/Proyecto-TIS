import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerUsuariosPaginado } from "../../services/usuarioService";
import "./Usuarios.css";

function IconoVer() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function IconoEditar() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

const TAMANO_PAGINA = 10;
const FILTROS_VACIOS = {
  nombre: "",
  apellido: "",
  ci: "",
  correo: "",
  rol: "TODOS",
  estado: "TODOS",
};

function Usuarios() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [filtrosAplicados, setFiltrosAplicados] = useState(FILTROS_VACIOS);
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalElementos, setTotalElementos] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargarUsuarios = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const respuesta = await obtenerUsuariosPaginado(pagina, TAMANO_PAGINA, filtrosAplicados);
      const data = respuesta.data;
      setUsuarios(Array.isArray(data.content) ? data.content : []);
      setTotalPaginas(data.totalPages || 0);
      setTotalElementos(data.totalElements || 0);
    } catch (err) {
      setUsuarios([]);
      setTotalPaginas(0);
      setTotalElementos(0);
      setError(
        err.response?.data?.mensaje ||
          err.response?.data?.message ||
          "No se pudieron cargar los usuarios. Intenta nuevamente.",
      );
    } finally {
      setCargando(false);
    }
  }, [pagina, filtrosAplicados]);

  useEffect(() => {
    void cargarUsuarios();
  }, [cargarUsuarios]);

  const actualizarFiltro = (campo, valor) => {
    setFiltros((actuales) => ({ ...actuales, [campo]: valor }));
  };

  const buscar = (event) => {
    event.preventDefault();
    setPagina(0);
    setFiltrosAplicados({ ...filtros });
  };

  const limpiar = () => {
    setFiltros(FILTROS_VACIOS);
    setPagina(0);
    setFiltrosAplicados({ ...FILTROS_VACIOS });
  };

  return (
    <div className="usuarios-pagina">
      <header className="usuarios-encabezado">
        <div>
          <h1>Usuarios</h1>
          <p>Gestiona los usuarios del sistema. Registra, consulta y actualiza su información.</p>
        </div>
      </header>

      <form className="usuarios-filtros" onSubmit={buscar}>
        <div className="usuarios-filtros-grid">
          <input placeholder="Nombre" value={filtros.nombre} maxLength={80} onChange={(e) => actualizarFiltro("nombre", e.target.value)} />
          <input placeholder="Apellido" value={filtros.apellido} maxLength={80} onChange={(e) => actualizarFiltro("apellido", e.target.value)} />
          <input
            placeholder="C.I."
            value={filtros.ci}
            maxLength={30}
            inputMode="numeric"
            onChange={(e) => actualizarFiltro("ci", e.target.value.replace(/\D/g, "").slice(0, 30))}
          />
          <input placeholder="Correo" value={filtros.correo} maxLength={150} onChange={(e) => actualizarFiltro("correo", e.target.value)} />
          <select value={filtros.rol} onChange={(e) => actualizarFiltro("rol", e.target.value)}>
            <option value="TODOS">Todos los roles</option>
            <option value="ADMINISTRADOR">ADMINISTRADOR</option>
            <option value="DOCENTE">DOCENTE</option>
            <option value="ESTUDIANTE">ESTUDIANTE</option>
          </select>
          <select value={filtros.estado} onChange={(e) => actualizarFiltro("estado", e.target.value)}>
            <option value="TODOS">Todos los estados</option>
            <option value="ACTIVO">Activo</option>
            <option value="INACTIVO">Inactivo</option>
          </select>
        </div>
        <div className="usuarios-filtros-botones">
          <button className="usuarios-boton-buscar" type="submit" disabled={cargando}>Buscar</button>
          <button className="usuarios-boton-limpiar" type="button" onClick={limpiar} disabled={cargando}>Limpiar</button>
        </div>
      </form>

      {error && <div className="usuarios-error" role="alert">{error} <button type="button" onClick={() => void cargarUsuarios()}>Reintentar</button></div>}

      <section className="usuarios-panel" aria-busy={cargando}>
        <table className="usuarios-tabla">
          <thead>
            <tr><th>N°</th><th>Nombre</th><th>Apellido</th><th>C.I.</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan="8" className="usuarios-vacio">Cargando usuarios…</td></tr>
            ) : usuarios.length === 0 ? (
              <tr><td colSpan="8" className="usuarios-vacio">{error ? "No se pudieron mostrar los usuarios." : "No se encontraron usuarios para los filtros seleccionados."}</td></tr>
            ) : usuarios.map((usuario, index) => (
              <tr key={usuario.idUsuario}>
                <td>{pagina * TAMANO_PAGINA + index + 1}</td>
                <td>{usuario.nombre}</td>
                <td>{usuario.apellido}</td>
                <td>{usuario.carnetIdentidad || "—"}</td>
                <td>{usuario.correo}</td>
                <td>{usuario.nombreRol}</td>
                <td><span className={usuario.activo ? "usuarios-estado activo" : "usuarios-estado inactivo"}>{usuario.activo ? "Activo" : "Inactivo"}</span></td>
                <td>
                  <button className="usuarios-boton-ver" onClick={() => navigate(`/usuarios/${usuario.idUsuario}`)}><IconoVer /> Ver</button>
                  <button className="usuarios-boton-editar" onClick={() => navigate(`/usuarios/${usuario.idUsuario}/editar`)}><IconoEditar /> Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="usuarios-pie">
          <span>Mostrando {totalElementos === 0 ? 0 : pagina * TAMANO_PAGINA + 1}–{Math.min((pagina + 1) * TAMANO_PAGINA, totalElementos)} de {totalElementos} usuarios</span>
          <div className="usuarios-paginacion">
            <button type="button" onClick={() => setPagina((actual) => Math.max(0, actual - 1))} disabled={cargando || pagina === 0}>Anterior</button>
            <span>{totalPaginas === 0 ? 0 : pagina + 1} / {totalPaginas}</span>
            <button type="button" onClick={() => setPagina((actual) => Math.min(totalPaginas - 1, actual + 1))} disabled={cargando || pagina + 1 >= totalPaginas}>Siguiente</button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Usuarios;
