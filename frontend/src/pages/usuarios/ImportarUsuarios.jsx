import "./ImportarUsuarios.css";

import {
    useMemo,
    useRef,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import {
    FiFileText,
    FiUpload,
    FiDownload,
    FiSearch,
    FiDatabase,
    FiLock,
    FiUsers,
    FiCheckCircle,
    FiXCircle,
    FiChevronRight
} from "react-icons/fi";

import {
    analizarImportacion,
    importarUsuarios
} from "../../services/usuarioService";

import {
    useAuth
} from "../../context/useAuth";


const NOMBRES = [
    "María", "Carla", "Jorge", "Luis", "Ana",
    "Rodrigo", "Paola", "Diego", "Valeria", "Cristhian",
    "Gabriela", "Marco", "Daniela", "Iván", "Natalia",
    "Sergio", "Andrea", "Miguel", "Katherine", "Ramiro"
];

const APELLIDOS = [
    "Mamani", "Quispe", "Flores", "Rojas", "Gutiérrez",
    "Chávez", "Vacaflor", "Salinas", "Ballesteros", "Heredia",
    "Torrico", "Zambrana", "Mercado", "Roca", "Fernández",
    "Aguirre", "Céspedes", "Montaño", "Peña", "Ríos"
];

const CARRERAS = [
    "Ingeniería de Sistemas",
    "Ingeniería Informática",
    "Ingeniería Industrial",
    "Ingeniería Civil",
    "Ingeniería Electromecánica",
    "Ingeniería Mecánica",
    "Lic. en Administración",
    "Lic. en Contaduría Pública",
    "Medicina",
    "Derecho",
    "Arquitectura",
    "Enfermería"
];

const FACULTADES = [
    "FCyT", "FCAP", "FCEyF",
    "FM", "FD", "FADU",
    "FCS", "FCM", "FCH"
];

const OBSERVACIONES_INVALIDAS = [
    "Código inválido",
    "Documento inválido",
    "Correo electrónico inválido",
    "Teléfono inválido",
    "Rol no válido"
];

const FILAS_INVALIDAS = [4, 17, 33, 52, 88];

const ROL_POR_INDEX = (i) => {
    if (i % 91 === 0) return "Administrador";
    if (i % 37 === 0) return "Docente";
    if (i % 53 === 0) return "Personal de ingreso";
    return "Estudiante";
};

const normalizar = (texto) =>
    String(texto || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");


function generarUsuariosDemo(){

    const filas = [];

    for (let i = 1; i <= 129; i++) {

        const indice = i - 1;

        const nombre =
            NOMBRES[indice % NOMBRES.length];

        const apellido1 =
            APELLIDOS[(indice * 3) % APELLIDOS.length];

        const apellido2 =
            APELLIDOS[(indice * 7) % APELLIDOS.length];

        const rol = ROL_POR_INDEX(indice);

        const invalido =
            FILAS_INVALIDAS.includes(indice);

        const estado =
            invalido ? "Inválido" : "Activo";

        const esEstudiante =
            rol === "Estudiante";

        const codigo =
            esEstudiante
                ? "2020" +
                  String(100 + (indice % 90))
                : "";

        filas.push({
            fila: i,
            documento:
                String(5000000 + indice * 211),
            nombres: nombre,
            apellidos:
                apellido1 + " " + apellido2,
            correo:
                normalizar(nombre) +
                "." +
                normalizar(apellido1) +
                (indice + 1) +
                "@est.umss.edu",
            telefono:
                "7" +
                String(
                    (6000000 + indice * 137) % 7000000
                ).padStart(7, "0"),
            rol,
            estado,
            codigoSis: codigo,
            carrera:
                esEstudiante
                    ? CARRERAS[indice % CARRERAS.length]
                    : "",
            facultad:
                esEstudiante
                    ? FACULTADES[
                          (indice * 5) % FACULTADES.length
                      ]
                    : "",
            observaciones:
                invalido
                    ? OBSERVACIONES_INVALIDAS[
                          FILAS_INVALIDAS.indexOf(indice)
                      ]
                    : ""
        });

    }

    return filas;

}


const DATOS_EJEMPLO = [
    {
        documento: "10000123",
        nombres: "María",
        apellidos: "Quispe Mamani",
        correo: "maria.quispe@est.umss.edu",
        telefono: "71234567",
        rol: "Estudiante",
        estado: "Activo",
        codigo: "20200001",
        carrera: "Ingeniería de Sistemas",
        facultad: "FCyT"
    },
    {
        documento: "10000456",
        nombres: "Jorge",
        apellidos: "Flores Rojas",
        correo: "jorge.flores@est.umss.edu",
        telefono: "71234568",
        rol: "Estudiante",
        estado: "Activo",
        codigo: "20200002",
        carrera: "Ingeniería Electromecánica",
        facultad: "FCyT"
    }
];


const COLUMNAS_ARCHIVO = [
    "Documento de identidad",
    "Nombres",
    "Apellidos",
    "Correo electrónico",
    "Teléfono",
    "Rol",
    "Estado",
    "Código universitario (solo Estudiante)",
    "Carrera (solo Estudiante)",
    "Facultad (solo Estudiante)"
];


const PASOS = [
    {
        numero: 1,
        titulo: "Cargar archivo",
        subtitulo: "Seleccione el CSV"
    },
    {
        numero: 2,
        titulo: "Revisar datos",
        subtitulo: "Valide la información"
    },
    {
        numero: 3,
        titulo: "Configurar",
        subtitulo: "Defina opciones"
    },
    {
        numero: 4,
        titulo: "Importar",
        subtitulo: "Registre los usuarios"
    }
];


const COLUMNAS_CSV = [
    {
        campo: "documento",
        etiquetas: [
            "documento",
            "documento de identidad",
            "documento identidad",
            "documento de identidad del usuario",
            "carnet",
            "carnet de identidad",
            "ci",
            "nro de documento",
            "numero de documento"
        ]
    },
    {
        campo: "nombres",
        etiquetas: [
            "nombres",
            "nombre",
            "nombres y apellidos",
            "nombre completo"
        ]
    },
    {
        campo: "apellidos",
        etiquetas: [
            "apellidos",
            "apellido",
            "apellidos del usuario"
        ]
    },
    {
        campo: "correo",
        etiquetas: [
            "correo",
            "correo electronico",
            "correo institucional",
            "email",
            "e mail"
        ]
    },
    {
        campo: "telefono",
        etiquetas: [
            "telefono",
            "telefono celular",
            "celular",
            "tel",
            "telefono movil"
        ]
    },
    {
        campo: "rol",
        etiquetas: [
            "rol",
            "perfil",
            "rol del usuario",
            "tipo de usuario"
        ]
    },
    {
        campo: "estado",
        etiquetas: [
            "estado",
            "estado del usuario"
        ]
    },
    {
        campo: "codigoSis",
        etiquetas: [
            "codigo universitario",
            "codigo sis",
            "codigo de estudiante",
            "codigo",
            "carnet de estudiante"
        ]
    },
    {
        campo: "carrera",
        etiquetas: [
            "carrera",
            "carrera del estudiante"
        ]
    },
    {
        campo: "facultad",
        etiquetas: [
            "facultad",
            "facultad del estudiante"
        ]
    }
];


const COLUMNAS_REQUERIDAS = [
    "documento",
    "nombres",
    "apellidos",
    "correo",
    "rol"
];


const DELIMITADORES_CSV = [
    ",",
    ";",
    "\t"
];


const CORREO_ESPERADO =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


const errorArchivo = (mensaje) => {

    const error = new Error(mensaje);

    error.esFormatoCsv = true;

    return error;

};


const columnaDeEncabezado = (celda) => {

    const texto =
        normalizar(celda)
            .replace(/\s+/g, " ")
            .trim();

    if(!texto){

        return null;

    }

    const exacta =
        COLUMNAS_CSV.find(
            columna =>
                columna.etiquetas.includes(texto)
        );

    if(exacta){

        return exacta.campo;

    }

    const porPrefijo =
        COLUMNAS_CSV.find(
            columna =>
                columna.etiquetas.some(
                    etiqueta =>
                        texto.startsWith(etiqueta)
                )
        );

    return porPrefijo
        ? porPrefijo.campo
        : null;

};


const esFilaEncabezado = (celdas) => {

    const coincidencias =
        (celdas || []).filter(
            celda =>
                columnaDeEncabezado(celda) !== null
        ).length;

    return coincidencias >= 3;

};


const contarDelimitadores = (
    texto,
    delimitador
) => {

    let entreComillas = false;

    let total = 0;

    for(let i = 0; i < texto.length; i++){

        const caracter = texto[i];

        if(caracter === "\""){

            entreComillas = !entreComillas;

        }
        else if(
            !entreComillas
            && caracter === delimitador
        ){

            total++;

        }

    }

    return total;

};


const detectarDelimitador = (texto) => {

    const muestra =
        String(texto || "")
            .split(/\r?\n/)
            .slice(0, 20)
            .join("\n");

    const candidatos =
        DELIMITADORES_CSV
            .map(
                delimitador => ({
                    delimitador,
                    total:
                        contarDelimitadores(
                            muestra,
                            delimitador
                        )
                })
            )
            .sort(
                (primero, segundo) =>
                    segundo.total - primero.total
            );

    return candidatos[0].total > 0
        ? candidatos[0].delimitador
        : ",";

};


const indicesDesdeEncabezado = (celdas) => {

    const mapa = {};

    (celdas || []).forEach(
        (celda, indice) => {

            const campo =
                columnaDeEncabezado(celda);

            if(campo && mapa[campo] === undefined){

                mapa[campo] = indice;

            }

        }
    );

    const faltantes =
        COLUMNAS_REQUERIDAS.filter(
            campo =>
                mapa[campo] === undefined
        );

    if(faltantes.length > 0){

        const nombresFaltantes =
            faltantes
                .map(
                    campo =>
                        COLUMNAS_CSV.find(
                            columna =>
                                columna.campo === campo
                        ).etiquetas[0]
                )
                .join(", ");

        throw errorArchivo(
            "El archivo no tiene las columnas requeridas. " +
            "Se esperaban: "
            + COLUMNAS_ARCHIVO.join(", ")
            + ". "
            + "Faltan: "
            + nombresFaltantes
            + "."
        );

    }

    return mapa;

};


const indicesPosicionales = () => {

    const mapa = {};

    COLUMNAS_CSV.forEach(
        (columna, indice) => {

            mapa[columna.campo] = indice;

        }
    );

    return mapa;

};


const validarFilaLocal = (fila) => {

    const errores = [
        ...(fila.erroresLocales || [])
    ];

    const documento =
        (fila.documento || "").trim();

    if(!documento){

        errores.push(
            "El documento de identidad es obligatorio"
        );

    }
    else if(!/^\d+$/.test(documento)){

        errores.push(
            "Documento inválido"
        );

    }

    if(!(fila.nombres || "").trim()){

        errores.push(
            "El nombre es obligatorio"
        );

    }

    if(!(fila.apellidos || "").trim()){

        errores.push(
            "El apellido es obligatorio"
        );

    }

    const correo =
        (fila.correo || "").trim();

    if(!correo){

        errores.push(
            "El correo es obligatorio"
        );

    }
    else if(!CORREO_ESPERADO.test(correo)){

        errores.push(
            "Correo electrónico inválido"
        );

    }

    const telefono =
        (fila.telefono || "").trim();

    if(telefono && !/^\d+$/.test(telefono)){

        errores.push(
            "Teléfono inválido"
        );

    }

    if(!(fila.rol || "").trim()){

        errores.push(
            "Debe seleccionar un rol"
        );

    }

    return [
        ...new Set(errores)
    ];

};


const combinarValidaciones = (
    filasRespuesta,
    filasEnviadas
) => {

    const erroresPorFila =
        new Map(
            filasEnviadas.map(
                fila => [
                    fila.fila,
                    validarFilaLocal(fila)
                ]
            )
        );

    return filasRespuesta.map(
        fila => {

            const erroresLocales =
                erroresPorFila.get(fila.fila) || [];

            if(erroresLocales.length === 0){

                return fila;

            }

            return {
                ...fila,
                estado: "Inválido",
                observaciones: [
                    ...new Set([
                        ...erroresLocales,
                        ...(fila.observaciones || [])
                    ])
                ]
            };

        }
    );

};


const contarValidos = (filas) =>

    filas.filter(
        fila =>
            fila.estado === "Activo"
            || fila.estado === "Registrado"
    ).length;


const contarInvalidos = (filas) =>

    filas.filter(
        fila =>
            fila.estado === "Inválido"
    ).length;


function parsearCSV(texto){

    const registros = [];

    const delimitador =
        detectarDelimitador(texto);

    let celdas = [];

    let campo = "";

    let entreComillas = false;

    let linea = 1;

    const empujar = () => {

        celdas.push(campo);

        campo = "";

        if(celdas.some(valor => valor.trim() !== "")){

            registros.push({
                linea,
                celdas
            });

        }

        celdas = [];

    };

    const textoLimpio =
        (texto || "").replace(/^\uFEFF/, "");

    for(let i = 0; i < textoLimpio.length; i++){

        const caracter = textoLimpio[i];

        if(entreComillas){

            if(caracter === "\""){

                if(textoLimpio[i + 1] === "\""){

                    campo += "\"";
                    i++;

                }
                else{

                    entreComillas = false;

                }

            }
            else{

                campo += caracter;

            }

        }
        else if(caracter === "\""){

            entreComillas = true;

        }
        else if(caracter === delimitador){

            celdas.push(campo);
            campo = "";

        }
        else if(caracter === "\n"){

            empujar();
            linea++;

        }
        else if(caracter === "\r"){

            if(textoLimpio[i + 1] === "\n"){

                i++;

            }

            empujar();
            linea++;

        }
        else{

            campo += caracter;

        }

    }

    if(campo !== ""
            || celdas.some(valor => valor.trim() !== "")){

        empujar();

    }

    return registros;

}


function convertirFilas(registros){

    const hayEncabezado =
        registros.length > 0
        && esFilaEncabezado(
            registros[0].celdas
        );

    const indices =
        hayEncabezado
            ? indicesDesdeEncabezado(
                registros[0].celdas
            )
            : indicesPosicionales();

    return registros
        .slice(
            hayEncabezado ? 1 : 0
        )
        .map(registro => {

            const celdas = registro.celdas;

            const erroresLocales = [];

            if(celdas.length > COLUMNAS_CSV.length){

                erroresLocales.push(
                    "La fila tiene "
                    + celdas.length
                    + " columnas y se esperaban "
                    + COLUMNAS_CSV.length
                );

            }

            const valor = campo =>
                (celdas[indices[campo]] || "").trim();

            return {

                fila: registro.linea,

                documento: valor("documento"),

                nombres: valor("nombres"),

                apellidos: valor("apellidos"),

                correo: valor("correo"),

                telefono: valor("telefono"),

                rol: valor("rol"),

                estado: valor("estado"),

                codigoSis: valor("codigoSis"),

                carrera: valor("carrera"),

                facultad: valor("facultad"),

                erroresLocales

            };

        });

}


const leerTexto = (archivo) =>

    new Promise((resolver,rechazar) => {

        const lector = new FileReader();

        lector.onload = () =>
            resolver(String(lector.result));

        lector.onerror = rechazar;

        lector.readAsText(archivo,"UTF-8");

    });


function ImportarUsuarios(){


    const navigate = useNavigate();

    const { usuario } = useAuth();

    const inputArchivo = useRef(null);


    const [archivo,setArchivo] = useState(null);

    const [arrastrando,setArrastrando] = useState(false);

    const [busqueda,setBusqueda] = useState("");

    const [filas,setFilas] = useState(
        () => generarUsuariosDemo()
    );

    const [filasCsv,setFilasCsv] = useState([]);

    const [estadoPorDefecto,setEstadoPorDefecto] =
        useState("Activo");

    const [pasoActivo,setPasoActivo] = useState(1);

    const [analizando,setAnalizando] = useState(false);

    const [importando,setImportando] = useState(false);

    const [importado,setImportado] = useState(false);

    const [mostrarExito,setMostrarExito] = useState(false);

    const [mensaje,setMensaje] = useState("");

    const [error,setError] = useState("");


    const validos =
        filas.filter(
            fila =>
                fila.estado === "Activo"
                || fila.estado === "Registrado"
        ).length;

    const conErrores =
        filas.filter(
            fila => fila.estado === "Inválido"
        ).length;

    const total = filas.length;


    const filasFiltradas = useMemo(
        () => {

            const texto =
                normalizar(busqueda);

            if(!texto){

                return filas;

            }

            return filas.filter(
                fila =>
                    [
                        fila.documento,
                        fila.nombres,
                        fila.apellidos,
                        fila.correo,
                        fila.telefono,
                        fila.rol,
                        fila.codigoSis,
                        fila.carrera,
                        fila.facultad,
                        textoObservacion(
                            fila.observaciones
                        )
                    ].some(
                        campo =>
                            normalizar(campo).includes(texto)
                    )
            );

        },
        [filas,busqueda]
    );


    const descargarPlantilla = () => {

        const cabecera =
            "Documento,Nombres,Apellidos," +
            "Correo,Teléfono,Rol,Estado," +
            "Código universitario,Carrera,Facultad";

        const contenido = DATOS_EJEMPLO.map(
            fila => [

                fila.documento,
                fila.nombres,
                fila.apellidos,
                fila.correo,
                fila.telefono,
                fila.rol,
                fila.estado,
                fila.codigo,
                fila.carrera,
                fila.facultad

            ].map(
                valor =>
                    `"${valor}"`
            ).join(",")
        ).join("\n");

        const blob = new Blob(
            [ cabecera + "\n" + contenido ],
            { type: "text/csv;charset=utf-8" }
        );

        const enlace =
            document.createElement("a");

        enlace.href =
            URL.createObjectURL(blob);

        enlace.download =
            "plantilla_usuarios.csv";

        enlace.click();

        URL.revokeObjectURL(enlace.href);

    };


    const prepararArchivo = async (archivoSeleccionado) => {

        if(!archivoSeleccionado){

            return;

        }

        if(
            !archivoSeleccionado.name
                .toLowerCase()
                .endsWith(".csv")
        ){

            setError(
                "El archivo debe tener formato CSV"
            );

            return;

        }

        setError("");

        setMensaje("");

        setAnalizando(true);

        try {

            const texto =
                await leerTexto(archivoSeleccionado);

            const filasParseadas =
                convertirFilas(
                    parsearCSV(texto)
                );

            if(filasParseadas.length === 0){

                setError(
                    "El archivo no contiene filas con datos"
                );

                return;

            }

            const respuesta =
                await analizarImportacion({
                    usuarios: filasParseadas,
                    estadoPorDefecto
                });

            const filasCombinadas =
                combinarValidaciones(
                    respuesta.data.filas,
                    filasParseadas
                );

            setArchivo(archivoSeleccionado);

            setFilasCsv(filasParseadas);

            setFilas(filasCombinadas);

            setPasoActivo(2);

            setMensaje(
                `Archivo analizado: ${
                    contarValidos(filasCombinadas)
                } ` +
                "usuarios válidos y " +
                `${
                    contarInvalidos(filasCombinadas)
                } con errores.`
            );

        }
        catch(err){

            console.error(
                "Error analizando archivo:",
                err
            );

            setError(
                err.response?.data?.mensaje
                || (
                    err.esFormatoCsv
                        ? err.message
                        : null
                )
                || "No se pudo analizar el archivo. " +
                "Verifique el formato CSV e intente nuevamente."
            );

        }
        finally{

            setAnalizando(false);

        }

    };


    const importar = async () => {

        if(!archivo || filasCsv.length === 0){

            setError(
                "Seleccione y analice un archivo CSV antes de importar"
            );

            return;

        }

        const filasImportables =
                filasCsv.filter(
                    fila =>
                        validarFilaLocal(fila).length === 0
                );


        if(filasImportables.length === 0){

            setError(
                "No hay filas válidas para importar. " +
                "Corrija los errores del archivo y vuelva a analizarlo."
            );

            return;

        }


        setError("");

        setMensaje("");

        setImportando(true);

        try {

            const respuesta =
                await importarUsuarios(
                    {
                        usuarios: filasImportables,
                        estadoPorDefecto
                    },
                    usuario?.idUsuario
                );

            const resultadoPorFila =
                new Map(
                    respuesta.data.filas.map(
                        fila => [fila.fila, fila]
                    )
                );

            const filasFinales =
                filas.map(
                    fila =>
                        resultadoPorFila.get(fila.fila)
                        || fila
                );

            setFilas(filasFinales);

            setImportado(true);

            setPasoActivo(4);

            setMostrarExito(true);

            setMensaje(
                `Importación completada: ${
                    contarValidos(filasFinales)
                } ` +
                "usuarios registrados correctamente y " +
                `${
                    contarInvalidos(filasFinales)
                } con errores.`
            );

        }
        catch(err){

            console.error(
                "Error importando usuarios:",
                err
            );

            setError(
                err.response?.data?.mensaje ||
                "No se pudo completar la importación. " +
                "Verifique la conexión e intente nuevamente."
            );

        }
        finally{

            setImportando(false);

        }

    };


    return (

        <div className="import-usuario">

            <nav className="import-migas">

                <span
                    className="import-migas-enlace"
                    onClick={() => navigate("/")}
                >
                    Inicio
                </span>

                <span className="import-migas-separador">
                    &gt;
                </span>

                <span
                    className="import-migas-enlace"
                    onClick={() => navigate("/usuarios")}
                >
                    Usuarios
                </span>

                <span className="import-migas-separador">
                    &gt;
                </span>

                <span className="import-migas-actual">
                    Importar usuarios
                </span>

            </nav>


            <div className="import-cabecera">

                <h1 className="import-titulo">
                    Importar usuarios (Carga masiva)
                </h1>

                <p className="import-subtitulo">
                    Carga un archivo CSV con la lista de usuarios
                    para registrarlos de forma masiva en el sistema.
                </p>

            </div>


            {
            error && (
                <p className="import-alerta import-alerta-error">
                    {error}
                </p>
            )
            }


            {
            mensaje && (
                <p className="import-alerta import-alerta-exito">
                    {mensaje}
                </p>
            )
            }


            <div className="import-pasos">

                {
                    PASOS.map(
                        paso => (

                            <div
                                key={paso.numero}
                                className={
                                    paso.numero === pasoActivo
                                        ? "import-paso import-paso-activo"
                                        : "import-paso"
                                }
                            >

                                <div className="import-paso-circulo">
                                    {paso.numero}
                                </div>


                                <div className="import-paso-texto">

                                    <strong>
                                        {paso.titulo}
                                    </strong>

                                    <span>
                                        {paso.subtitulo}
                                    </span>

                                </div>

                            </div>
                        )
                    )
                }

            </div>


            <div className="import-tarjetas-superiores">

                <section className="import-tarjeta import-tarjeta-archivo">

                    <h2 className="import-tarjeta-titulo">
                        Seleccionar archivo CSV
                    </h2>


                    <div
                        className={
                            arrastrando
                                ? "import-zona import-zona-arrastrando"
                                : "import-zona"
                        }
                        onDragOver={
                            e => {
                                e.preventDefault();
                                setArrastrando(true);
                            }
                        }
                        onDragLeave={
                            () =>
                            setArrastrando(false)
                        }
                        onDrop={
                            e => {
                                e.preventDefault();
                                setArrastrando(false);
                                prepararArchivo(
                                    e.dataTransfer.files?.[0]
                                );
                            }
                        }
                    >

                        <span className="import-zona-icono">
                            <FiFileText />
                        </span>

                        <strong className="import-zona-texto">
                            Arrastra y suelta un archivo CSV aquí
                        </strong>


                        {
                        archivo && (
                            <span className="import-zona-archivo">
                                {archivo.name}
                            </span>
                        )
                        }


                        <button
                            type="button"
                            className="import-boton import-boton-seleccionar"
                            onClick={
                                () =>
                                inputArchivo.current?.click()
                            }
                            disabled={analizando}
                        >
                            <FiUpload />

                            {
                            analizando
                                ? "Analizando..."
                                : "Seleccionar archivo"
                            }

                        </button>


                        <input
                            ref={inputArchivo}
                            type="file"
                            accept=".csv,text/csv"
                            hidden
                            onChange={
                                e =>
                                prepararArchivo(
                                    e.target.files?.[0]
                                )
                            }
                        />


                        <span className="import-zona-formato">
                            Formato admitido: CSV (máx. 10 MB)
                        </span>

                    </div>


                    <p className="import-nota">
                        El archivo debe contener una tabla con
                        los datos de los usuarios.
                    </p>

                </section>


                <section className="import-tarjeta import-tarjeta-formato">

                    <div className="import-tarjeta-cabecera">

                        <h2 className="import-tarjeta-titulo">
                            Formato del archivo
                        </h2>

                        <button
                            type="button"
                            className="import-boton import-boton-descarga"
                            onClick={descargarPlantilla}
                        >
                            <FiDownload />

                            Descargar plantilla (CSV)
                        </button>

                    </div>


                    <div className="import-formato-aviso">

                        El archivo CSV debe contener las siguientes
                        columnas (en este orden):

                    </div>


                    <ol className="import-formato-lista">

                        {
                            COLUMNAS_ARCHIVO.map(
                                columna => (
                                    <li key={columna}>
                                        {columna}
                                    </li>
                                )
                            )
                        }

                    </ol>


                    <table className="import-tabla-ejemplo">

                        <thead>

                            <tr>
                                <th>Documento</th>
                                <th>Nombres</th>
                                <th>Apellidos</th>
                                <th>Correo electrónico</th>
                                <th>Teléfono</th>
                                <th>Rol</th>
                                <th>Estado</th>
                                <th>Cod.</th>
                                <th>Carrera</th>
                                <th>Facultad</th>
                            </tr>

                        </thead>

                        <tbody>

                            {
                                DATOS_EJEMPLO.map(
                                    (fila, i) => (
                                        <tr key={i}>
                                            <td>{fila.documento}</td>
                                            <td>{fila.nombres}</td>
                                            <td>{fila.apellidos}</td>
                                            <td>{fila.correo}</td>
                                            <td>{fila.telefono}</td>
                                            <td>{fila.rol}</td>
                                            <td>
                                                <span className="import-chip import-chip-verde">
                                                    {fila.estado}
                                                </span>
                                            </td>
                                            <td>{fila.codigo}</td>
                                            <td>{fila.carrera}</td>
                                            <td>{fila.facultad}</td>
                                        </tr>
                                    )
                                )
                            }

                        </tbody>

                    </table>

                </section>

            </div>


            <section className="import-tarjeta import-tarjeta-detectados">

                <div className="import-tarjeta-cabecera">

                    <div>

                        <h2 className="import-tarjeta-titulo">
                            Usuarios detectados
                        </h2>

                        <p className="import-tarjeta-subtitulo">
                            Se mostrará una vista previa de los datos
                            extraídos del archivo.
                        </p>

                    </div>


                    <div className="import-herramientas">

                        <div className="import-buscador">

                            <FiSearch />

                            <input

                                value={busqueda}

                                onChange={
                                    e =>
                                    setBusqueda(e.target.value)
                                }

                                placeholder="Buscar en la tabla..."

                            />

                        </div>


                        <span className="import-chip import-chip-verde">
                            {validos} válidos
                        </span>

                        <span className="import-chip import-chip-amarillo">
                            {conErrores} con errores
                        </span>

                        <span className="import-chip import-chip-total">
                            Total: {total}
                        </span>

                    </div>

                </div>


                <div className="import-tabla-contenedor">

                    <table className="import-tabla">

                        <thead>

                            <tr>
                                <th>N°</th>
                                <th>Documento</th>
                                <th>Nombres</th>
                                <th>Apellidos</th>
                                <th>Correo electrónico</th>
                                <th>Teléfono</th>
                                <th>Rol</th>
                                <th>Estado</th>
                                <th>Código</th>
                                <th>Carrera</th>
                                <th>Facultad</th>
                                <th>Observaciones</th>
                            </tr>

                        </thead>

                        <tbody>

                            {
                                filasFiltradas.map(
                                    fila => (

                                        <tr
                                            key={fila.fila || fila.indice}
                                            className={
                                                fila.estado === "Inválido"
                                                    ? "import-fila-error"
                                                    : ""
                                            }
                                        >

                                            <td>{fila.fila}</td>
                                            <td>{fila.documento}</td>
                                            <td>{fila.nombres}</td>
                                            <td>{fila.apellidos}</td>
                                            <td>{fila.correo}</td>
                                            <td>{fila.telefono}</td>
                                            <td>{fila.rol}</td>

                                            <td>

                                                <span
                                                    className={
                                                        fila.estado === "Inválido"
                                                            ? "import-chip import-chip-rojo"
                                                            : "import-chip import-chip-verde"
                                                    }
                                                >
                                                    {fila.estado}
                                                </span>

                                            </td>

                                            <td>{fila.codigoSis || "—"}</td>
                                            <td>{fila.carrera || "—"}</td>
                                            <td>{fila.facultad || "—"}</td>

                                            <td className="import-observacion">
                                                {
                                                    textoObservacion(
                                                        fila.observaciones
                                                    )
                                                }
                                            </td>

                                        </tr>

                                    )
                                )
                            }

                        </tbody>

                    </table>

                </div>

            </section>


            <section className="import-tarjeta import-tarjeta-opciones">

                <h2 className="import-tarjeta-titulo">
                    Opciones de importación
                </h2>

                <p className="import-tarjeta-subtitulo">
                    Define los valores por defecto o reglas para los
                    usuarios que se registrarán.
                </p>


                <div className="import-opciones-fila">

                    <div className="import-opcion">

                        <label className="import-etiqueta">
                            Estado por defecto
                            <span className="import-requerido">*</span>
                        </label>

                        <select
                            className="import-select"
                            value={estadoPorDefecto}
                            onChange={
                                e =>
                                setEstadoPorDefecto(e.target.value)
                            }
                        >

                            <option>Activo</option>
                            <option>Inactivo</option>

                        </select>

                    </div>


                    <div className="import-opcion">

                        <label className="import-etiqueta">
                            Generar contraseña temporal
                            <span className="import-requerido">*</span>
                        </label>

                        <select
                            className="import-select"
                            defaultValue="Sí (se generará automáticamente)"
                        >

                            <option>Sí (se generará automáticamente)</option>
                            <option>No</option>

                        </select>

                    </div>


                    <div className="import-aviso">

                        <FiLock />

                        <span>
                            Se generará una contraseña temporal para cada
                            usuario, la cual deberá ser cambiada en su
                            primer inicio de sesión.
                        </span>

                    </div>

                </div>


                <div className="import-acciones">

                    <button
                        type="button"
                        className="import-boton import-boton-cancelar"
                        onClick={() => navigate("/usuarios")}
                    >
                        Cancelar
                    </button>


                    <button
                        type="button"
                        className="import-boton import-boton-importar"
                        onClick={importar}
                        disabled={
                            importando || importado || !archivo
                        }
                    >
                        {
                        importando
                            ? (
                                <span className="import-mini-rueda" />
                            )
                            : <FiDatabase />
                        }

                        {
                        importando
                            ? "Importando..."
                            : `Importar usuarios (${validos})`
                        }

                    </button>

                </div>

            </section>


            {
            mostrarExito && (

                <div className="import-modal-fondo">

                    <div className="import-modal-exito">

                        <div className="icono-exito">
                            ✓
                        </div>

                        <h2>
                            Importación exitosa
                        </h2>

                        <p className="import-modal-desc">
                            La carga masiva de usuarios se completó correctamente.
                        </p>

                        <div className="import-modal-stats">

                            <div className="import-modal-stat">
                                <FiCheckCircle />
                                <strong>{validos}</strong>
                                <span>Registrados</span>
                            </div>

                            <div className="import-modal-stat">
                                <FiXCircle />
                                <strong>{conErrores}</strong>
                                <span>Con errores</span>
                            </div>

                            <div className="import-modal-stat">
                                <FiUsers />
                                <strong>{total}</strong>
                                <span>Total filas</span>
                            </div>

                        </div>

                        {
                        conErrores > 0 && (
                            <p className="import-modal-nota">
                                Revise las filas marcadas como inválidas
                                en la tabla de resultados.
                            </p>
                        )
                        }

                        <div className="import-modal-acciones">

                            <button
                                type="button"
                                className="import-boton import-boton-cancelar"
                                onClick={
                                    () => setMostrarExito(false)
                                }
                            >
                                Aceptar
                            </button>

                            <button
                                type="button"
                                className="import-boton import-boton-importar"
                                onClick={
                                    () => navigate("/usuarios")
                                }
                            >
                                Ver listado de usuarios
                                <FiChevronRight />
                            </button>

                        </div>

                    </div>

                </div>

            )
            }


            {
            (analizando || importando) && (

                <div className="import-overlay">

                    <div className="import-overlay-caja">

                        <span className="import-rueda" />

                        <strong>
                            {
                            analizando
                                ? "Analizando archivo..."
                                : "Importando usuarios..."
                            }
                        </strong>

                        <span>
                            {
                            analizando
                                ? "Validando la información del archivo CSV."
                                : "Registrando los usuarios en el sistema. " +
                                  "Esto puede tomar unos segundos."
                            }
                        </span>

                    </div>

                </div>

            )
            }

        </div>

    );

}


function textoObservacion(observaciones){

    if(Array.isArray(observaciones)){

        return observaciones.join(" | ") || "—";

    }

    return observaciones || "—";

}


export default ImportarUsuarios;