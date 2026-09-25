import {
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";


import {
    verificarCodigoRecuperacion
}
from "../../services/authService";


import "./RecuperacionContrasena.css";



function VerificarCodigo(){


const navigate = useNavigate();


const [codigo,setCodigo]=useState("");

const [error,setError]=useState("");



const verificar = async(e)=>{

e.preventDefault();


const correo =
localStorage.getItem(
"correoRecuperacion"
);



try{


await verificarCodigoRecuperacion(
correo,
codigo
);


localStorage.setItem(
"codigoRecuperacion",
codigo
);


navigate("/nueva-contrasena");


}catch{

setError(
"Código incorrecto o expirado"
);

}

};

return (

<div className="recuperacion-page">


<div className="recuperacion-card">


<h2>
Verificar código
</h2>


<p>
Ingresa el código enviado a tu correo.
</p>



<form onSubmit={verificar}>


<input
type="text"

maxLength="6"

placeholder="000000"

value={codigo}

onChange={
e=>setCodigo(e.target.value)
}

/>



{
error &&
<p className="error">
{error}
</p>
}



<button>
Verificar
</button>


</form>


<button

className="volver"

onClick={()=>
navigate("/recuperar-contrasena")
}

>
Volver
</button>


</div>


</div>


);


}


export default VerificarCodigo;