import {
  BrowserRouter,
  Navigate,
  Route,
  Routes
} from "react-router-dom";


import { AuthProvider } from "./context/AuthContext.jsx";


import ProtectedRoute from "./routes/ProtectedRoute.jsx";



import EditarUsuario from "./pages/usuarios/EditarUsuario.jsx";
import RolesPermisos from "./pages/usuarios/RolesPermisos.jsx";
import PlantillaPrincipal from "./components/Layout/PlantillaPrincipal.jsx";
import Usuarios from "./pages/usuarios/Usuarios.jsx";
import Inicio from "./pages/Inicio/Inicio.jsx";

import RegistrarEstudiante from "./pages/estudiantes/RegistrarEstudiante.jsx";
import Estudiantes from "./pages/estudiantes/Estudiantes.jsx";
import DetalleEstudiante from "./pages/estudiantes/DetalleEstudiante.jsx";
import Auditoria from "./pages/auditoria/Auditoria.jsx";

import Login from "./pages/auth/Login.jsx";



function App() {

  return (
    <AuthProvider>

      <BrowserRouter>

        <Routes>

          {/* Layout público */}
          <Route element={<PlantillaPrincipal />}>

            <Route
              path="/"
              element={<Inicio />}
            />

          </Route>


          {/* Login */}
          <Route
            path="/login"
            element={<Login />}
          />


          {/* Layout protegido */}
          <Route
            element={
              <ProtectedRoute>
                <PlantillaPrincipal />
              </ProtectedRoute>
            }
          >

            <Route
              path="/usuarios"
              element={<Usuarios />}
            />

            <Route
              path="/usuarios/roles-permisos"
              element={<RolesPermisos />}
            />

            <Route
              path="/usuarios/:id/editar"
              element={<EditarUsuario />}
            />

            <Route
              path="/estudiantes/registrar"
              element={<RegistrarEstudiante />}
            />

            <Route
              path="/estudiantes/consultar"
              element={<Estudiantes />}
            />

            <Route
              path="/estudiantes/:idUsuario"
              element={<DetalleEstudiante />}
            />

          </Route>


          {/* Ruta no encontrada */}
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