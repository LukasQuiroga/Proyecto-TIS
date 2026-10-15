import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext.jsx";

import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import ProtectedPermission from "./routes/ProtectedPermission.jsx";

import PlantillaPrincipal from "./components/Layout/PlantillaPrincipal.jsx";

import Inicio from "./pages/Inicio/Inicio.jsx";

import Login from "./pages/auth/Login.jsx";
import RecuperarContrasena from "./pages/auth/RecuperarContrasena.jsx";
import VerificarCodigo from "./pages/auth/VerificarCodigo.jsx";
import NuevaContrasena from "./pages/auth/NuevaContrasena.jsx";

import Usuarios from "./pages/usuarios/Usuarios.jsx";
import EditarUsuario from "./pages/usuarios/EditarUsuario.jsx";
import RolesPermisos from "./pages/usuarios/RolesPermisos.jsx";
import VerUsuario from "./pages/usuarios/VerUsuario.jsx";
import RegistroUsuario from "./pages/usuarios/RegistroUsuario.jsx";
import ImportarUsuarios from "./pages/usuarios/ImportarUsuarios.jsx";
import PermisosActualizadosModal from "./components/Modal/PermisosActualizadosModal";
import Asignaturas from "./pages/asignaturas/Asignaturas.jsx";
import InscripcionQr from "./pages/asignaturas/InscripcionQr.jsx";
import InscripcionEstudianteQr from "./pages/asignaturas/InscripcionEstudianteQr.jsx";

import Examenes from "./pages/examenes/Examenes.jsx";
import RegistrarExamen from "./pages/examenes/RegistrarExamen.jsx";
import ConfigurarExamen from "./pages/examenes/ConfigurarExamen.jsx";
import AccesoNoAutorizadoExamenes from "./pages/examenes/AccesoNoAutorizadoExamenes.jsx";

import Auditoria from "./pages/auditoria/Auditoria.jsx";

import Perfil from "./pages/perfil/Perfil.jsx";
import Habilitaciones from "./pages/habilitaciones/Habilitaciones.jsx";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <PermisosActualizadosModal />
        <Routes>
          {/* RUTAS PUBLICAS */}

          <Route path="/login" element={<Login />} />

          <Route
            path="/recuperar-contrasena"
            element={<RecuperarContrasena />}
          />

          <Route path="/verificar-codigo" element={<VerificarCodigo />} />

          <Route path="/nueva-contrasena" element={<NuevaContrasena />} />

          {/* PAGINA PRINCIPAL PUBLICA */}

          <Route element={<PlantillaPrincipal />}>
            <Route path="/" element={<Inicio />} />
          </Route>

          {/* RUTAS PROTEGIDAS */}

          <Route
            element={
              <ProtectedRoute>
                <PlantillaPrincipal />
              </ProtectedRoute>
            }
          >
            {/* PERFIL */}

            <Route path="/perfil" element={<Perfil />} />

            {/* USUARIOS */}

            <Route
              path="/usuarios"
              element={
                <ProtectedPermission permiso="GESTIONAR_USUARIOS">
                  <Usuarios />
                </ProtectedPermission>
              }
            />

            <Route
              path="/usuarios/:id"
              element={
                <ProtectedPermission permiso="GESTIONAR_USUARIOS">
                  <VerUsuario />
                </ProtectedPermission>
              }
            />

            <Route
              path="/usuarios/:id/editar"
              element={
                <ProtectedPermission permiso="GESTIONAR_USUARIOS">
                  <EditarUsuario />
                </ProtectedPermission>
              }
            />

            <Route
              path="/usuarios/registro"
              element={
                <ProtectedPermission permiso="REGISTRAR_USUARIOS">
                  <RegistroUsuario />
                </ProtectedPermission>
              }
            />

            <Route
              path="/usuarios/importar"
              element={
                <ProtectedPermission permiso="IMPORTAR_USUARIOS">
                  <ImportarUsuarios />
                </ProtectedPermission>
              }
            />

            <Route
              path="/usuarios/roles-permisos"
              element={
                <ProtectedPermission permiso="GESTIONAR_ROLES">
                  <RolesPermisos />
                </ProtectedPermission>
              }
            />

            {/* ASIGNATURAS */}

            <Route
              path="/asignaturas"
              element={
                <ProtectedPermission permiso="GESTIONAR_MATERIAS">
                  <Asignaturas />
                </ProtectedPermission>
              }
            />

            {/* HU12 - Inscripción de estudiantes mediante QR */}
            <Route
              path="/asignaturas/inscripcion-qr"
              element={<InscripcionQr />}
            />

            {/* HU12 - Confirmación de inscripción del estudiante */}
            <Route
              path="/inscripcion-qr/inscribir"
              element={<InscripcionEstudianteQr />}
            />

            {/* EXÁMENES */}

            <Route
              path="/examenes"
              element={
                <ProtectedPermission
                  permiso="GESTIONAR_EXAMENES"
                  accesoDenegado={<AccesoNoAutorizadoExamenes />}
                >
                  <Examenes />
                </ProtectedPermission>
              }
            />

            <Route
              path="/examenes/registro"
              element={
                <ProtectedPermission
                  permiso="GESTIONAR_EXAMENES"
                  accesoDenegado={<AccesoNoAutorizadoExamenes />}
                >
                  <RegistrarExamen />
                </ProtectedPermission>
              }
            />

            <Route
              path="/examenes/:id/editar"
              element={
                <ProtectedPermission
                  permiso="GESTIONAR_EXAMENES"
                  accesoDenegado={<AccesoNoAutorizadoExamenes />}
                >
                  <RegistrarExamen />
                </ProtectedPermission>
              }
            />

            <Route
              path="/examenes/:id/configuracion"
              element={
                <ProtectedPermission
                  permiso="GESTIONAR_EXAMENES"
                  accesoDenegado={<AccesoNoAutorizadoExamenes />}
                >
                  <ConfigurarExamen />
                </ProtectedPermission>
              }
            />

            {/* HABILITACIONES */}
            <Route
              path="/habilitaciones"
              element={<Habilitaciones />}
            />

            {/* AUDITORIA */}

            <Route
              path="/auditoria"
              element={
                <ProtectedPermission permiso="VER_AUDITORIA">
                  <Auditoria />
                </ProtectedPermission>
              }
            />
          </Route>

          {/* RUTA NO EXISTENTE */}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
