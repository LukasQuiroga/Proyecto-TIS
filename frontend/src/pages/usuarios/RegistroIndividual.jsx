import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Usuarios.css";

function RegistroIndividual() {
    const navigate = useNavigate();
    const [rol, setRol] = useState("");

    return (
        <div className="usuarios-pagina">
            <header className="usuarios-encabezado">
                <div>
                    <h1>Registrar usuario</h1>
                    <p>Ingrese los datos del nuevo usuario.</p>
                </div>
            </header>

            <section className="usuarios-panel">
                <form className="usuarios-formulario">
                    <div className="usuarios-formulario-grid">
                        <div className="usuarios-campo">
                            <label htmlFor="nombres">Nombres</label>
                            <input
                                id="nombres"
                                name="nombres"
                                type="text"
                                placeholder="Ingrese los nombres"
                            />
                        </div>

                        <div className="usuarios-campo">
                            <label htmlFor="apellidos">Apellidos</label>
                            <input
                                id="apellidos"
                                name="apellidos"
                                type="text"
                                placeholder="Ingrese los apellidos"
                            />
                        </div>

                        <div className="usuarios-campo">
                            <label htmlFor="documentoIdentidad">
                                Documento de identidad
                            </label>
                            <input
                                id="documentoIdentidad"
                                name="documentoIdentidad"
                                type="text"
                                placeholder="Ingrese el documento"
                            />
                        </div>

                        <div className="usuarios-campo">
                            <label htmlFor="correo">Correo electrónico</label>
                            <input
                                id="correo"
                                name="correo"
                                type="email"
                                placeholder="ejemplo@correo.com"
                            />
                        </div>

                        <div className="usuarios-campo">
                            <label htmlFor="telefono">Teléfono</label>
                            <input
                                id="telefono"
                                name="telefono"
                                type="tel"
                                placeholder="Ingrese el teléfono"
                            />
                        </div>
                    </div>

                    <div className="usuarios-campo">
                        <label htmlFor="rol">Rol</label>

                        <select
                            id="rol"
                            name="rol"
                            value={rol}
                            onChange={(event) => setRol(event.target.value)}
                        >
                            <option value="">Seleccione un rol</option>
                            <option value="Administrador">Administrador</option>
                            <option value="Docente">Docente</option>
                            <option value="Personal de ingreso">
                                Personal de ingreso
                            </option>
                            <option value="Estudiante">Estudiante</option>
                        </select>
                    </div>

                    <div className="usuarios-formulario-acciones">
                        <button
                            type="button"
                            className="usuarios-boton-cancelar"
                            onClick={() => navigate("/usuarios/registrar")}
                        >
                            Cancelar
                        </button>

                        <button
                            type="button"
                            className="usuarios-boton-nuevo"
                        >
                            Registrar usuario
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}

export default RegistroIndividual;