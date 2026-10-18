CREATE TABLE permiso (

    id_permiso BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    nombre_permiso VARCHAR(100) NOT NULL UNIQUE,

    descripcion VARCHAR(255)

);


CREATE TABLE rol_permiso (

    id_rol BIGINT NOT NULL REFERENCES rol(id_rol)
    ON DELETE CASCADE,

    id_permiso BIGINT NOT NULL REFERENCES permiso(id_permiso)
    ON DELETE CASCADE,

    PRIMARY KEY(id_rol, id_permiso)

);


INSERT INTO permiso(nombre_permiso, descripcion) VALUES

('GESTIONAR_USUARIOS', 'Permite administrar usuarios'),

('GESTIONAR_ROLES', 'Permite administrar roles y permisos'),

('GESTIONAR_ESTUDIANTES', 'Permite gestionar estudiantes'),

('GESTIONAR_EXAMENES', 'Permite gestionar examenes'),

('CONTROL_INGRESO', 'Permite controlar ingreso'),

('GENERAR_REPORTES', 'Permite generar reportes');


INSERT INTO rol_permiso(id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM rol r, permiso p
WHERE r.nombre_rol = 'ADMINISTRADOR';


INSERT INTO rol_permiso(id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM rol r, permiso p
WHERE r.nombre_rol = 'DOCENTE'
AND p.nombre_permiso IN (
    'GESTIONAR_EXAMENES',
    'GENERAR_REPORTES'
);


INSERT INTO rol_permiso(id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM rol r, permiso p
WHERE r.nombre_rol = 'ESTUDIANTE'
AND p.nombre_permiso IN (
    'CONTROL_INGRESO'
);