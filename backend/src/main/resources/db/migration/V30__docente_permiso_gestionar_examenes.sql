-- HU09: Registrar examenes
-- Asegura que el rol DOCENTE tenga por defecto el permiso GESTIONAR_EXAMENES,
-- que habilita el registro, edicion y configuracion de examenes.
-- Idempotente: no falla si el permiso ya esta asignado.

INSERT INTO seguridad.rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM seguridad.rol r
CROSS JOIN seguridad.permiso p
WHERE r.nombre_rol = 'DOCENTE'
  AND p.nombre_permiso = 'GESTIONAR_EXAMENES'
ON CONFLICT (id_rol, id_permiso) DO NOTHING;
