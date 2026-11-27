DELETE FROM seguridad.rol_permiso rp
USING seguridad.rol r, seguridad.permiso p
WHERE rp.id_rol = r.id_rol
  AND rp.id_permiso = p.id_permiso
  AND r.nombre_rol = 'ADMINISTRADOR'
  AND p.nombre_permiso = 'GESTIONAR_EXAMENES';

DELETE FROM seguridad.rol_permiso rp
USING seguridad.rol r, seguridad.permiso p
WHERE rp.id_rol = r.id_rol
  AND rp.id_permiso = p.id_permiso
  AND r.nombre_rol = 'DOCENTE'
  AND p.nombre_permiso NOT IN (
      'GESTIONAR_USUARIOS',
      'IMPORTAR_USUARIOS',
      'GESTIONAR_ROLES',
      'REGISTRAR_USUARIOS',
      'GESTIONAR_MATERIAS',
      'GESTIONAR_EXAMENES',
      'GESTIONAR_HABILITACIONES',
      'CONTROL_INGRESO'
  );

DELETE FROM seguridad.rol_permiso rp
USING seguridad.rol r, seguridad.permiso p
WHERE rp.id_rol = r.id_rol
  AND rp.id_permiso = p.id_permiso
  AND r.nombre_rol IN (
      'AUXILIAR',
      'PERSONAL DE INGRESO'
  )
  AND p.nombre_permiso <> 'CONTROL_INGRESO';