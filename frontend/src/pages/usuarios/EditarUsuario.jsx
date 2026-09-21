import {
useEffect,
useState
} from "react";


import {
useNavigate,
useParams
} from "react-router-dom";


import {
obtenerUsuario,
modificarUsuario,
obtenerRoles
}
from "../../services/usuarioService";


function EditarUsuario(){

const {id}=useParams();

const navigate=useNavigate();

const [usuario,setUsuario]=useState(null);

const [roles,setRoles]=useState([]);

useEffect(()=>{

cargar();

},[]);

const cargar=async()=>{

const u =
await obtenerUsuario(id);

const r =
await obtenerRoles();

setUsuario({

nombre:u.data.nombre,

apellido:u.data.apellido,

correo:u.data.correo,

contrasena:"",

idRol:u.data.idRol,

activo:u.data.activo

});

setRoles(
r.data
);

};

const guardar=async(e)=>{

e.preventDefault();

await modificarUsuario(
id,
usuario
);

navigate("/usuarios");

};

if(!usuario)
return <p>Cargando...</p>;

return (

<div>

<h1>
Editar usuario
</h1>

<form onSubmit={guardar}>

<input

value={usuario.nombre}

onChange={
e=>setUsuario({
...usuario,
nombre:e.target.value
})
}

/>

<input

value={usuario.apellido}

onChange={
e=>setUsuario({
...usuario,
apellido:e.target.value
})
}
/>
<input
value={usuario.correo}
onChange={
e=>setUsuario({
...usuario,
correo:e.target.value
})
}
/>
<select
value={usuario.idRol}
onChange={
e=>setUsuario({
...usuario,
idRol:e.target.value
})
}
>
{
roles.map(
rol=>(
<option
key={rol.idRol}
value={rol.idRol}
>
{rol.nombreRol}
</option>
)
)
}
</select>
<button>
Guardar
</button>
</form>
</div>
);
}

export default EditarUsuario;