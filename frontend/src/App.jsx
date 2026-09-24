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

import Login from "./pages/auth/Login.jsx";



function App() {


  return (


    <BrowserRouter>


      <Routes>



        {/* Sistema principal */}

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



        </Route>





        {/* HU01 Inicio de sesión */}

        <Route
          path="/login"
          element={<Login />}
        />





        {/* rutas inexistentes */}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />



      </Routes>


    </BrowserRouter>


  );

}



export default App;