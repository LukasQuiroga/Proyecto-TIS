UPDATE permiso
SET descripcion = 'Gestionar usuarios'
WHERE nombre_permiso = 'GESTIONAR_USUARIOS';


UPDATE permiso
SET descripcion = 'Gestionar roles y permisos'
WHERE nombre_permiso = 'GESTIONAR_ROLES';


UPDATE permiso
SET descripcion = 'Gestionar estudiantes'
WHERE nombre_permiso = 'GESTIONAR_ESTUDIANTES';


UPDATE permiso
SET descripcion = 'Gestionar exámenes'
WHERE nombre_permiso = 'GESTIONAR_EXAMENES';


UPDATE permiso
SET descripcion = 'Control de ingreso'
WHERE nombre_permiso = 'CONTROL_INGRESO';


UPDATE permiso
SET descripcion = 'Generar reportes'
WHERE nombre_permiso = 'GENERAR_REPORTES';


INSERT INTO permiso(nombre_permiso, descripcion)
VALUES

(
    'IMPORTAR_USUARIOS',
    'Importar usuarios'
),

(
    'REGISTRAR_USUARIOS',
    'Registrar usuarios'
),

(
    'GESTIONAR_AMBIENTES',
    'Gestionar ambientes'
),

(
    'GESTIONAR_HABILITACIONES',
    'Gestionar habilitaciones'
),

(
    'VER_AUDITORIA',
    'Ver auditoría'
)

ON CONFLICT (nombre_permiso) DO NOTHING;


INSERT INTO rol_permiso(id_rol, id_permiso)

SELECT 
    r.id_rol,
    p.id_permiso

FROM rol r

CROSS JOIN permiso p

WHERE r.nombre_rol = 'ADMINISTRADOR'

ON CONFLICT (id_rol, id_permiso) DO NOTHING;