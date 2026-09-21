import {
useEffect,
useState
} from "react";


import {
obtenerUsuarios
}
from "../../services/usuarioService";

function Usuarios(){
const [usuarios,setUsuarios]=useState([]);
useEffect(()=>{
cargar();
},[]);
const cargar=async()=>{
const respuesta =
await obtenerUsuarios();
setUsuarios(
respuesta.data
);
};
return (
<div>
<h1>
Gestión de usuarios
</h1>
<table>
<thead>
<tr>
<th>
Nombre
</th>
<th>
Correo
</th>
<th>
Estado
</th>
</tr>
</thead>
<tbody>
{
usuarios.map(
usuario=>(

<tr key={usuario.idUsuario}>

<td>
{usuario.nombre}
</td>

<td>
{usuario.correo}
</td>


<td>{
usuario.activo
?
"Activo"
:
"Inactivo"}

</td></tr>)
)}
</tbody>
</table>
</div>
);

}

export default Usuarios;