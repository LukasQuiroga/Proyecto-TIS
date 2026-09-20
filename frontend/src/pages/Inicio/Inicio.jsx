import Navbar from "../../components/Navbar/Navbar";
import Sidebar from "../../components/Sidebar/Sidebar";
import "./Inicio.css";

function IconoModulo({ tipo }) {
  const iconos = {
    estudiantes: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),

    examenes: (
      <svg viewBox="0 0 24 24">
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </svg>
    ),

    ambientes: (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M7 8h3v3H7zM14 8h3v3h-3zM7 14h3v3H7zM14 14h3v3h-3z" />
      </svg>
    ),

    habilitaciones: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5L16 9" />
      </svg>
    ),

    ingreso: (
      <svg viewBox="0 0 24 24">
        <path d="M14 8l4 4-4 4" />
        <path d="M18 12H8" />
        <path d="M11 4H5v16h6" />
      </svg>
    ),

    reportes: (
      <svg viewBox="0 0 24 24">
        <path d="M5 20V10M12 20V4M19 20v-7" />
      </svg>
    ),

    usuarios: (
      <svg viewBox="0 0 24 24">
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="10" r="2" />
        <path d="M3 20c0-4 2.7-7 6-7s6 3 6 7" />
        <path d="M15 15c3 0 5 2 5 5" />
      </svg>
    ),
  };

  return (
    <div className="inicio-icono-modulo">
      {iconos[tipo]}
    </div>
  );
}

const funcionalidades = [
  {
    tipo: "estudiantes",
    titulo: "Estudiantes",
    descripcion:
      "Registro, consulta y administración de estudiantes del sistema.",
  },
  {
    tipo: "examenes",
    titulo: "Exámenes",
    descripcion:
      "Registro y configuración de los exámenes programados.",
  },
  {
    tipo: "ambientes",
    titulo: "Ambientes",
    descripcion:
      "Gestión de aulas y ambientes destinados a los exámenes.",
  },
  {
    tipo: "habilitaciones",
    titulo: "Habilitaciones",
    descripcion:
      "Control de estudiantes habilitados para cada examen.",
  },
  {
    tipo: "ingreso",
    titulo: "Control de ingreso",
    descripcion:
      "Validación de estudiantes durante el ingreso a los exámenes.",
  },
  {
    tipo: "reportes",
    titulo: "Reportes",
    descripcion:
      "Consulta de asistencia, ausentes y registros del sistema.",
  },
  {
    tipo: "usuarios",
    titulo: "Usuarios",
    descripcion:
      "Administración de usuarios, roles y permisos.",
  },
];

function Inicio() {
  return (
    <div className="inicio-pagina">
      <Sidebar />

      <div className="inicio-zona-principal">
        <Navbar />

        <main className="inicio-contenido">
          <div className="inicio-ruta">
            <span>Inicio</span>
          </div>

          <div className="inicio-titulo">
            <h1>Inicio</h1>

            <p>
              Bienvenido al Sistema de Control de Ingreso a
              Exámenes Masivos.
            </p>
          </div>

          <section className="inicio-bienvenida">
            <div className="inicio-bienvenida-texto">
              <span className="inicio-etiqueta">
                Panel principal
              </span>

              <h2>
                Sistema de Control de Ingreso a Exámenes
              </h2>

              <p>
                Consulte las principales funcionalidades
                disponibles para la administración y control
                de los exámenes.
              </p>
            </div>

            <div className="inicio-bienvenida-imagen">
              <div className="inicio-documento">
                <div className="inicio-documento-icono">
                  ✓
                </div>

                <div className="inicio-linea linea-1"></div>
                <div className="inicio-linea linea-2"></div>
                <div className="inicio-linea linea-3"></div>
              </div>
            </div>
          </section>

          <section className="inicio-modulos">
            <div className="inicio-subtitulo">
              <h2>Funcionalidades del sistema</h2>

              <p>
                Módulos disponibles para la gestión del
                sistema.
              </p>
            </div>

            <div className="inicio-grid">
              {funcionalidades.map((funcionalidad) => (
                <article
                  className="inicio-tarjeta"
                  key={funcionalidad.titulo}
                >
                  <IconoModulo tipo={funcionalidad.tipo} />

                  <div className="inicio-tarjeta-informacion">
                    <h3>
                      {funcionalidad.titulo}
                    </h3>

                    <p>
                      {funcionalidad.descripcion}
                    </p>

                    <span className="inicio-ver-modulo">
                      Ver módulo
                      <span>→</span>
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="inicio-aviso">
            <div className="inicio-aviso-icono">
              i
            </div>

            <div>
              <strong>Información</strong>

              <p>
                Seleccione una opción del menú lateral para
                acceder a las funcionalidades correspondientes.
              </p>
            </div>
          </section>
        </main>

        <footer className="inicio-footer">
          <span>
            Sistema de Control de Ingreso a Exámenes Masivos
          </span>

          <span>
            © 2026. Todos los derechos reservados.
          </span>
        </footer>
      </div>
    </div>
  );
}

export default Inicio;