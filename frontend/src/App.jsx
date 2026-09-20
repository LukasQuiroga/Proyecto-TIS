import {
  BrowserRouter,
  Navigate,
  Route,
  Routes
} from "react-router-dom";

import Inicio
  from "./pages/Inicio/Inicio";

import Estudiantes
  from "./pages/estudiantes/Estudiantes";

import DetalleEstudiante
  from "./pages/estudiantes/DetalleEstudiante";


function App() {

  return (

    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<Inicio />}
        />

        <Route
          path="/estudiantes"
          element={<Estudiantes />}
        />

        <Route
          path="/estudiantes/:idUsuario"
          element={<DetalleEstudiante />}
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>

  );
}

export default App;