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

import Auditoria from "./pages/auditoria/Auditoria.jsx";


function App() {

  return (
    <AuthProvider>

      <BrowserRouter>

        <Routes>


          {/* RUTAS PUBLICAS */}

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/recuperar-contrasena"
            element={<RecuperarContrasena />}
          />

          <Route
            path="/verificar-codigo"
            element={<VerificarCodigo />}
          />

          <Route
            path="/nueva-contrasena"
            element={<NuevaContrasena />}
          />



          {/* PAGINA INICIAL */}

          <Route
            element={<PlantillaPrincipal />}
          >

            <Route
              path="/"
              element={<Inicio />}
            />

          </Route>



          {/* RUTAS PROTEGIDAS */}

          <Route
            element={
              <ProtectedRoute>
                <PlantillaPrincipal />
              </ProtectedRoute>
            }
          >


            {/* Gestión Usuarios */}

            <Route
              path="/usuarios"
              element={
                  <ProtectedPermission permiso="GESTIONAR_USUARIOS">
                      <Usuarios />
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
              path="/usuarios/roles-permisos"
              element={
                <ProtectedPermission permiso="GESTIONAR_ROLES">
                  <RolesPermisos />
                </ProtectedPermission>
              }
            />


            {/* Auditoría */}

            <Route
              path="/auditoria"
              element={
                  <ProtectedPermission permiso="VER_AUDITORIA">
                      <Auditoria />
                  </ProtectedPermission>
              }
            />


          </Route>



          {/* RUTA DESCONOCIDA */}

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />


        </Routes>

      </BrowserRouter>

    </AuthProvider>
  );
}


export default App;