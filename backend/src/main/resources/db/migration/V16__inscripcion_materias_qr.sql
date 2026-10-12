
-- HU12: Inscripcion de estudiantes a materias mediante QR

CREATE TABLE academico.qr_inscripcion (
    id_qr BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_materia BIGINT NOT NULL
        REFERENCES academico.materia(id_materia),

    token_hash VARCHAR(64) NOT NULL UNIQUE,

    fecha_creacion TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    fecha_expiracion TIMESTAMPTZ NOT NULL,

    revocado BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT chk_qr_inscripcion_expiracion
        CHECK (fecha_expiracion > fecha_creacion),

    CONSTRAINT chk_qr_inscripcion_hash
        CHECK (token_hash ~ '^[0-9a-f]{64}$')
);

CREATE INDEX idx_qr_inscripcion_materia
    ON academico.qr_inscripcion(id_materia);


CREATE TABLE academico.materia_estudiante (
    id_materia BIGINT NOT NULL
        REFERENCES academico.materia(id_materia),

    id_estudiante BIGINT NOT NULL
        REFERENCES seguridad.usuario(id_usuario),

    id_qr BIGINT NOT NULL
        REFERENCES academico.qr_inscripcion(id_qr),

    fecha_inscripcion TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_materia_estudiante
        PRIMARY KEY (id_materia, id_estudiante)
);

CREATE INDEX idx_materia_estudiante_estudiante
    ON academico.materia_estudiante(id_estudiante);
