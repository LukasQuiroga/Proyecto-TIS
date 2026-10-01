DELETE FROM rol_permiso
WHERE id_permiso IN (
    SELECT id_permiso
    FROM permiso
    WHERE nombre_permiso = 'GESTIONAR_ESTUDIANTES'
);


DELETE FROM permiso
WHERE nombre_permiso = 'GESTIONAR_ESTUDIANTES';