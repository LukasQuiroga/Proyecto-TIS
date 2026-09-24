import { useNavigate } from "react-router-dom";
import "./Navbar.css";


function Navbar() {


  const navigate = useNavigate();



  return (

    <header className="navbar">


      <div className="navbar-menu">

        ☰

      </div>




      <div

        className="navbar-login"

        onClick={() => navigate("/login")}

      >


        <div className="navbar-avatar">

          👤

        </div>



        <span>

          Inicio de sesión

        </span>



      </div>



    </header>

  );

}



export default Navbar;