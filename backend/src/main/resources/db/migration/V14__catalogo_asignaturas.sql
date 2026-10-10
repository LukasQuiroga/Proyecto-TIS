CREATE TABLE academico.asignatura (

    id_asignatura BIGINT GENERATED ALWAYS AS IDENTITY
        PRIMARY KEY,

    codigo_asignatura VARCHAR(30) NOT NULL,

    nombre_asignatura VARCHAR(120) NOT NULL,

    semestre SMALLINT NOT NULL,

    activo BOOLEAN NOT NULL DEFAULT TRUE,

    descripcion TEXT,

    CONSTRAINT chk_asignatura_codigo
        CHECK (
            codigo_asignatura ~ '^[A-Za-z0-9_-]+$'
        ),

    CONSTRAINT chk_asignatura_nombre
        CHECK (
            LENGTH(TRIM(nombre_asignatura)) >= 3
            AND LENGTH(nombre_asignatura) <= 120
        ),

    CONSTRAINT chk_asignatura_semestre
        CHECK (
            semestre BETWEEN 1 AND 10
        )
);


CREATE UNIQUE INDEX uq_asignatura_codigo
    ON academico.asignatura (
        UPPER(TRIM(codigo_asignatura))
    );

CREATE TABLE academico.asignatura_carrera (

    id_asignatura BIGINT NOT NULL
        REFERENCES academico.asignatura(id_asignatura)
        ON DELETE CASCADE,

    carrera VARCHAR(120) NOT NULL,

    CONSTRAINT pk_asignatura_carrera
        PRIMARY KEY (id_asignatura, carrera),

    CONSTRAINT chk_asignatura_carrera_nombre
        CHECK (
            LENGTH(TRIM(carrera)) > 0
        )
);


CREATE UNIQUE INDEX uq_asignatura_carrera_normalizada
    ON academico.asignatura_carrera (
        id_asignatura,
        LOWER(TRIM(carrera))
    );


ALTER TABLE academico.materia
    ADD COLUMN id_asignatura BIGINT
        REFERENCES academico.asignatura(id_asignatura);


CREATE INDEX idx_materia_asignatura
    ON academico.materia(id_asignatura);



INSERT INTO seguridad.permiso (
    nombre_permiso,
    descripcion
)
VALUES (
    'GESTIONAR_MATERIAS',
    'Permite gestionar el catalogo de asignaturas'
)
ON CONFLICT (nombre_permiso) DO NOTHING;

INSERT INTO seguridad.rol_permiso (
    id_rol,
    id_permiso
)
SELECT
    r.id_rol,
    p.id_permiso
FROM seguridad.rol r
CROSS JOIN seguridad.permiso p
WHERE r.nombre_rol = 'ADMINISTRADOR'
  AND p.nombre_permiso = 'GESTIONAR_MATERIAS'
ON CONFLICT (id_rol, id_permiso) DO NOTHING;