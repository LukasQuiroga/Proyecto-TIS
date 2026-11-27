DELETE FROM seguridad.rol_permiso
WHERE id_permiso IN (
    SELECT id_permiso
    FROM seguridad.permiso
    WHERE nombre_permiso = 'GESTIONAR_AMBIENTES'
);

DELETE FROM seguridad.permiso
WHERE nombre_permiso = 'GESTIONAR_AMBIENTES';