-- HU21: QR unico por estudiante y examen
-- Almacena el token del QR, su estado de envio y la relacion con el examen.

CREATE TABLE academico.qr_examen_estudiante (
    id_qr_examen BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_examen BIGINT NOT NULL
        REFERENCES academico.examen(id_examen),

    id_estudiante BIGINT NOT NULL
        REFERENCES seguridad.usuario(id_usuario),

    id_materia BIGINT NOT NULL
        REFERENCES academico.materia(id_materia),

    token_hash VARCHAR(64) NOT NULL UNIQUE,

    token_cifrado TEXT NOT NULL,

    fecha_creacion TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    fecha_envio TIMESTAMPTZ,

    estado_envio VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',

    intentos_envio INTEGER NOT NULL DEFAULT 0,

    ultimo_error VARCHAR(500),

    revocado BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT uq_qr_examen_estudiante
        UNIQUE (id_examen, id_estudiante),

    CONSTRAINT chk_qr_examen_token_hash
        CHECK (token_hash ~ '^[0-9a-f]{64}$'),

    CONSTRAINT chk_qr_examen_estado_envio
        CHECK (estado_envio IN ('PENDIENTE', 'ENVIADO', 'ERROR'))
);

CREATE INDEX idx_qr_examen_estudiante_examen
    ON academico.qr_examen_estudiante(id_examen);

CREATE INDEX idx_qr_examen_estudiante_estudiante
    ON academico.qr_examen_estudiante(id_estudiante);

CREATE INDEX idx_qr_examen_estudiante_materia
    ON academico.qr_examen_estudiante(id_materia);

CREATE INDEX idx_qr_examen_estudiante_estado
    ON academico.qr_examen_estudiante(estado_envio);
