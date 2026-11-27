DELETE FROM seguridad.rol_permiso rp
USING seguridad.rol r, seguridad.permiso p
WHERE rp.id_rol = r.id_rol
  AND rp.id_permiso = p.id_permiso
  AND r.nombre_rol = 'DOCENTE'
  AND p.nombre_permiso IN (
      'IMPORTAR_USUARIOS',
      'REGISTRAR_USUARIOS',
      'GESTIONAR_ROLES'
  );