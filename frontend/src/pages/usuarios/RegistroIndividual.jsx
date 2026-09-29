import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Usuarios.css";

function RegistroIndividual() {
    const navigate = useNavigate();

    const [formulario, setFormulario] = useState({
        nombres: "",
        apellidos: "",
        documentoIdentidad: "",
        correo: "",
        telefono: "",
        rol: "",
        codigoUniversitario: "",
        carrera: "",
    });

    const [errores, setErrores] = useState({});

    const manejarCambio = (event) => {
        const { name, value } = event.target;

        setFormulario((anterior) => ({
            ...anterior,
            [name]: value,
        }));
    };

    const validarFormulario = () => {
    const nuevosErrores = {};

    const regexNombre = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]+$/;
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const regexDocumento = /^[A-Za-z0-9.-]+$/;
    const regexTelefono = /^[0-9+\-\s()]+$/;

    if (!formulario.nombres.trim()) {
        nuevosErrores.nombres = "Los nombres son obligatorios.";
    } else if (!regexNombre.test(formulario.nombres.trim())) {
        nuevosErrores.nombres =
            "Los nombres contienen caracteres no válidos.";
    }

    if (!formulario.apellidos.trim()) {
        nuevosErrores.apellidos = "Los apellidos son obligatorios.";
    } else if (!regexNombre.test(formulario.apellidos.trim())) {
        nuevosErrores.apellidos =
            "Los apellidos contienen caracteres no válidos.";
    }

    if (!formulario.documentoIdentidad.trim()) {
        nuevosErrores.documentoIdentidad =
            "El documento de identidad es obligatorio.";
    } else if (
        !regexDocumento.test(formulario.documentoIdentidad.trim())
    ) {
        nuevosErrores.documentoIdentidad =
            "El documento de identidad tiene un formato inválido.";
    }

    if (!formulario.correo.trim()) {
        nuevosErrores.correo =
            "El correo electrónico es obligatorio.";
    } else if (!regexCorreo.test(formulario.correo.trim())) {
        nuevosErrores.correo =
            "Ingrese un correo electrónico válido.";
    }

    if (
        formulario.telefono.trim() &&
        !regexTelefono.test(formulario.telefono.trim())
    ) {
        nuevosErrores.telefono =
            "El teléfono tiene un formato inválido.";
    }

    if (!formulario.rol) {
        nuevosErrores.rol = "Debe seleccionar un rol.";
    }

    if (formulario.rol === "Estudiante") {
        if (!formulario.codigoUniversitario.trim()) {
            nuevosErrores.codigoUniversitario =
                "El código universitario es obligatorio.";
        }

        if (!formulario.carrera) {
            nuevosErrores.carrera =
                "Debe seleccionar una carrera.";
        }
    }

    setErrores(nuevosErrores);

    return Object.keys(nuevosErrores).length === 0;
};

const manejarRegistro = () => {
    const formularioValido = validarFormulario();

    if (!formularioValido) {
        return;
    }

};

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
                                value={formulario.nombres}
                                onChange={manejarCambio}
                            />

                            {errores.nombres && (
                                <span className="usuarios-error">
                                    {errores.nombres}
                                </span>
                            )}
                        </div>

                        <div className="usuarios-campo">
                            <label htmlFor="apellidos">Apellidos</label>
                            <input
                                id="apellidos"
                                name="apellidos"
                                type="text"
                                placeholder="Ingrese los apellidos"
                                value={formulario.apellidos}
                                onChange={manejarCambio}
                            />

                            {errores.apellidos && (
                                <span className="usuarios-error">
                                    {errores.apellidos}
                                </span>
                            )}
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
                                value={formulario.documentoIdentidad}
                                onChange={manejarCambio}
                            />

                            {errores.documentoIdentidad && (
                                <span className="usuarios-error">
                                    {errores.documentoIdentidad}
                                </span>
                            )}
                        </div>

                        <div className="usuarios-campo">
                            <label htmlFor="correo">
                                Correo electrónico
                            </label>
                            <input
                                id="correo"
                                name="correo"
                                type="email"
                                placeholder="ejemplo@correo.com"
                                value={formulario.correo}
                                onChange={manejarCambio}
                            />

                            {errores.correo && (
                                <span className="usuarios-error">
                                    {errores.correo}
                                </span>
                            )}
                        </div>

                        <div className="usuarios-campo">
                            <label htmlFor="telefono">Teléfono</label>
                            <input
                                id="telefono"
                                name="telefono"
                                type="tel"
                                placeholder="Ingrese el teléfono"
                                value={formulario.telefono}
                                onChange={manejarCambio}
                            />

                            {errores.telefono && (
                                <span className="usuarios-error">
                                    {errores.telefono}
                                </span>
                            )}
                        </div>

                        <div className="usuarios-campo">
                            <label htmlFor="rol">Rol</label>
                            <select
                                id="rol"
                                name="rol"
                                value={formulario.rol}
                                onChange={manejarCambio}
                            >
                                <option value="">Seleccione un rol</option>
                                <option value="Administrador">
                                    Administrador
                                </option>
                                <option value="Docente">
                                    Docente
                                </option>
                                <option value="Personal de ingreso">
                                    Personal de ingreso
                                </option>
                                <option value="Estudiante">
                                    Estudiante
                                </option>
                            </select>

                            {errores.rol && (
                                <span className="usuarios-error">
                                    {errores.rol}
                                </span>
                            )}
                        </div>

                        {formulario.rol === "Estudiante" && (
                            <>
                                <div className="usuarios-campo">
                                    <label htmlFor="codigoUniversitario">
                                        Código universitario
                                    </label>
                                    <input
                                        id="codigoUniversitario"
                                        name="codigoUniversitario"
                                        type="text"
                                        placeholder="Ingrese el código universitario"
                                        value={formulario.codigoUniversitario}
                                        onChange={manejarCambio}
                                    />

                                    {errores.codigoUniversitario && (
                                        <span className="usuarios-error">
                                            {errores.codigoUniversitario}
                                        </span>
                                    )}
                                </div>

                                <div className="usuarios-campo">
                                    <label htmlFor="carrera">
                                        Carrera
                                    </label>
                                    <select
                                        id="carrera"
                                        name="carrera"
                                        value={formulario.carrera}
                                        onChange={manejarCambio}
                                    >
                                        <option value="" disabled>
                                            Seleccione una carrera
                                        </option>
                                    </select>

                                    {errores.carrera && (
                                        <span className="usuarios-error">
                                            {errores.carrera}
                                        </span>
                                    )}
                                </div>
                            </>
                        )}
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
                            onClick={manejarRegistro}
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