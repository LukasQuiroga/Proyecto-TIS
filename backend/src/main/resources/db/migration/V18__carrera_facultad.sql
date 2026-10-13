CREATE TABLE academico.facultad (
    id_facultad BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo      VARCHAR(20)  NOT NULL UNIQUE,
    nombre      VARCHAR(150) NOT NULL UNIQUE
);

CREATE TABLE academico.carrera (
    id_carrera  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre      VARCHAR(150) NOT NULL UNIQUE,
    id_facultad BIGINT       NOT NULL REFERENCES academico.facultad (id_facultad)
);

CREATE TABLE academico.usuario_carrera (
    id_usuario BIGINT NOT NULL REFERENCES seguridad.usuario (id_usuario) ON DELETE CASCADE,
    id_carrera BIGINT NOT NULL REFERENCES academico.carrera (id_carrera) ON DELETE CASCADE,
    PRIMARY KEY (id_usuario, id_carrera)
);

INSERT INTO academico.facultad (codigo, nombre) VALUES
    ('FCyT',  'Facultad de Ciencias y Tecnología'),
    ('FCEyF', 'Facultad de Ciencias Económicas y Financieras'),
    ('FCM',   'Facultad de Ciencias Médicas'),
    ('FD',    'Facultad de Derecho'),
    ('FAyCH', 'Facultad de Arquitectura y Ciencias del Hábitat'),
    ('FACSO', 'Facultad de Ciencias Sociales');

INSERT INTO academico.carrera (nombre, id_facultad) VALUES
    ('Ingeniería de Sistemas',     (SELECT id_facultad FROM academico.facultad WHERE codigo = 'FCyT')),
    ('Ingeniería Informática',     (SELECT id_facultad FROM academico.facultad WHERE codigo = 'FCyT')),
    ('Ingeniería Industrial',      (SELECT id_facultad FROM academico.facultad WHERE codigo = 'FCyT')),
    ('Ingeniería Civil',           (SELECT id_facultad FROM academico.facultad WHERE codigo = 'FCyT')),
    ('Ingeniería Eléctrica',       (SELECT id_facultad FROM academico.facultad WHERE codigo = 'FCyT')),
    ('Ingeniería Mecánica',        (SELECT id_facultad FROM academico.facultad WHERE codigo = 'FCyT')),
    ('Ingeniería Electromecánica', (SELECT id_facultad FROM academico.facultad WHERE codigo = 'FCyT')),
    ('Lic. en Administración',     (SELECT id_facultad FROM academico.facultad WHERE codigo = 'FCEyF')),
    ('Lic. en Contaduría Pública', (SELECT id_facultad FROM academico.facultad WHERE codigo = 'FCEyF')),
    ('Medicina',                   (SELECT id_facultad FROM academico.facultad WHERE codigo = 'FCM')),
    ('Enfermería',                 (SELECT id_facultad FROM academico.facultad WHERE codigo = 'FCM')),
    ('Derecho',                    (SELECT id_facultad FROM academico.facultad WHERE codigo = 'FD')),
    ('Arquitectura',               (SELECT id_facultad FROM academico.facultad WHERE codigo = 'FAyCH')),
    ('Lic. en Sociología',         (SELECT id_facultad FROM academico.facultad WHERE codigo = 'FACSO'));

INSERT INTO academico.carrera (nombre, id_facultad)
SELECT DISTINCT
       btrim(u.carrera),
       (SELECT id_facultad FROM academico.facultad WHERE codigo = 'FCyT')
FROM seguridad.usuario u
WHERE u.carrera IS NOT NULL
  AND btrim(u.carrera) <> ''
  AND NOT EXISTS (
      SELECT 1
      FROM academico.carrera c
      WHERE c.nombre = btrim(u.carrera)
  );

INSERT INTO academico.usuario_carrera (id_usuario, id_carrera)
SELECT u.id_usuario,
       c.id_carrera
FROM seguridad.usuario u
JOIN academico.carrera c ON c.nombre = btrim(u.carrera)
WHERE u.carrera IS NOT NULL
  AND btrim(u.carrera) <> '';

ALTER TABLE seguridad.usuario DROP COLUMN carrera;
ALTER TABLE seguridad.usuario DROP COLUMN facultad;
