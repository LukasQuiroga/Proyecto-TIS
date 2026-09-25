import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";

import PlantillaPrincipal from "./components/Layout/PlantillaPrincipal.jsx";

import Inicio from "./pages/Inicio/Inicio.jsx";

import EditarUsuario from "./pages/usuarios/EditarUsuario.jsx";
import Usuarios from "./pages/usuarios/Usuarios.jsx";



import Auditoria from "./pages/auditoria/Auditoria.jsx";

import Login from "./pages/auth/Login.jsx";
import RecuperarContrasena from "./pages/auth/RecuperarContrasena.jsx";
import VerificarCodigo from "./pages/auth/VerificarCodigo.jsx";
import NuevaContrasena from "./pages/auth/NuevaContrasena.jsx";


function App(){

    return(
        <AuthProvider>
            <BrowserRouter>

                <Routes>

                    {/* Rutas públicas */}

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


                    {/* Inicio */}

                    <Route element={<PlantillaPrincipal />}>

                        <Route
                            path="/"
                            element={<Inicio />}
                        />

                    </Route>


                    {/* Rutas protegidas */}

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
                            path="/usuarios/:id/editar"
                            element={<EditarUsuario />}
                        />

                        <Route
                            path="/auditoria"
                            element={<Auditoria />}
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