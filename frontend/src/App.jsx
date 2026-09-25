import {
  BrowserRouter,
  Navigate,
  Route,
  Routes
} from "react-router-dom";
import EditarUsuario from "./pages/usuarios/EditarUsuario.jsx";
import PlantillaPrincipal from "./components/Layout/PlantillaPrincipal.jsx";
import Usuarios from "./pages/usuarios/Usuarios.jsx";
import Inicio from "./pages/Inicio/Inicio.jsx";
import RegistrarEstudiante from "./pages/estudiantes/RegistrarEstudiante.jsx";
import Estudiantes from "./pages/estudiantes/Estudiantes.jsx";
import DetalleEstudiante from "./pages/estudiantes/DetalleEstudiante.jsx";
import Auditoria from "./pages/auditoria/Auditoria.jsx";


function App() {

  return (

    <BrowserRouter>

      <Routes>

        <Route element={<PlantillaPrincipal />}>

          <Route
            path="/"
            element={<Inicio />}
          />

          <Route
          path="/usuarios"
          element={<Usuarios />}
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

          <Route
            path="/auditoria"
            element={<Auditoria />}
          />

        </Route>


        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>

    </BrowserRouter>

  );
}

export default App;