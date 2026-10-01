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
import DetalleUsuario from "./pages/usuarios/DetalleUsuario";

import RegistrarUsuario from "./pages/usuarios/RegistrarUsuario.jsx";
import RegistroIndividual from "./pages/usuarios/RegistroIndividual.jsx";
import ImportarUsuarios from "./pages/usuarios/ImportarUsuarios.jsx";

import Auditoria from "./pages/auditoria/Auditoria.jsx";

import Perfil from "./pages/perfil/Perfil.jsx";

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>

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

                    <Route element={<PlantillaPrincipal />}>
                        <Route
                            path="/"
                            element={<Inicio />}
                        />
                    </Route>

                    <Route
                        element={
                            <ProtectedRoute>
                                <PlantillaPrincipal />
                            </ProtectedRoute>
                        }
                    >

                        <Route
                            path="/perfil"
                            element={<Perfil />}
                        />

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
                                <DetalleUsuario />
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
                            path="/usuarios/registrar"
                            element={
                                <ProtectedPermission permiso="GESTIONAR_USUARIOS">
                                    <RegistrarUsuario />
                                </ProtectedPermission>
                            }
                        />

                        <Route
                            path="/usuarios/registrar/individual"
                            element={
                                <ProtectedPermission permiso="GESTIONAR_USUARIOS">
                                    <RegistroIndividual />
                                </ProtectedPermission>
                            }
                        />

                        <Route
                            path="/usuarios/importar"
                            element={
                                <ProtectedPermission permiso="GESTIONAR_USUARIOS">
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

                        <Route
                            path="/auditoria"
                            element={
                                <ProtectedPermission permiso="VER_AUDITORIA">
                                    <Auditoria />
                                </ProtectedPermission>
                            }
                        />

                    </Route>

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