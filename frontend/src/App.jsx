import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

import PlantillaPrincipal from "./components/Layout/PlantillaPrincipal.jsx";
import Inicio from "./pages/Inicio/Inicio.jsx";
import RegistrarEstudiante from "./pages/estudiantes/RegistrarEstudiante.jsx";
import ConsultarEstudiante from "./pages/estudiantes/ConsultarEstudiante.jsx";

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
            path="/estudiantes/registrar"
            element={<RegistrarEstudiante />}
          />

          <Route
            path="/estudiantes/consultar"
            element={<ConsultarEstudiante />}
            />
        </Route> 
      </Routes>
    </BrowserRouter>
  );
}

export default Aplicacion;