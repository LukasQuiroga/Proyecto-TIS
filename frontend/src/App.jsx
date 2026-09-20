import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

import PlantillaPrincipal from "./components/Layout/PlantillaPrincipal.jsx";
import Inicio from "./pages/Inicio/Inicio.jsx";
import Estudiantes from "./pages/estudiantes/Estudiantes.jsx";

function Aplicacion() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PlantillaPrincipal />}>
          <Route
            path="/"
            element={<Inicio />}
          />

          <Route
            path="/estudiantes"
            element={<Estudiantes />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default Aplicacion;