import { FaBookOpen, FaGraduationCap, FaLaptopCode } from "react-icons/fa";
import "./Inicio.css";

const figuras = [
  { tipo: "circulo", clase: "morado", top: "8%", left: "16%" },
  { tipo: "triangulo", clase: "celeste", top: "11%", left: "34%" },
  { tipo: "triangulo", clase: "celeste", top: "14%", right: "22%" },
  { tipo: "cuadrado", clase: "celeste-suave", top: "16%", right: "10%" },
  { tipo: "circulo", clase: "morado", top: "28%", left: "7%" },
  { tipo: "triangulo", clase: "celeste", top: "34%", left: "24%" },
  { tipo: "circulo", clase: "celeste-suave", top: "46%", left: "9%" },
  { tipo: "circulo", clase: "morado", top: "36%", right: "13%" },
  { tipo: "triangulo", clase: "celeste", top: "52%", right: "22%" },
  { tipo: "triangulo", clase: "naranja", top: "67%", left: "20%" },
  { tipo: "cuadrado", clase: "celeste-suave", top: "79%", left: "43%" },
  { tipo: "circulo", clase: "morado", top: "76%", right: "27%" },
  { tipo: "triangulo", clase: "celeste", top: "84%", left: "33%" },
  { tipo: "triangulo", clase: "celeste", top: "72%", right: "18%" },
  { tipo: "triangulo", clase: "azul", top: "74%", right: "9%" }
];

function Inicio() {
  return (
    <section className="inicio-home">
      {figuras.map((figura, index) => (
        <span
          key={index}
          className={`inicio-figura ${figura.tipo} ${figura.clase}`}
          style={{
            top: figura.top,
            left: figura.left,
            right: figura.right
          }}
        />
      ))}

      <div className="inicio-hero">
        <div className="inicio-personaje inicio-personaje-izq">
          <div className="inicio-personaje-fondo" />
          <div className="inicio-personaje-icono">
            <FaLaptopCode />
          </div>
        </div>

        <div className="inicio-centro">
          <div className="inicio-logo-icono">
            <FaGraduationCap />
          </div>

          <h1 className="inicio-logo-texto">
            <span className="inicio-logo-dark">Exam</span>
            <span className="inicio-logo-blue">Pass</span>
          </h1>

          <h2 className="inicio-subtitulo-principal">
            Control de ingreso a
            <br />
            exámenes masivos
          </h2>

          <p className="inicio-descripcion-principal">
            Una plataforma para gestionar estudiantes, materias
            <br />
            y exámenes de manera simple y segura.
          </p>
        </div>

        <div className="inicio-personaje inicio-personaje-der">
          <div className="inicio-personaje-fondo" />
          <div className="inicio-personaje-icono">
            <FaBookOpen />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Inicio;