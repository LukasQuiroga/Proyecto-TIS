CREATE TABLE academico.expulsion (
    id_expulsion BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_examen BIGINT NOT NULL
        REFERENCES academico.examen(id_examen),

    id_estudiante BIGINT NOT NULL
        REFERENCES seguridad.usuario(id_usuario),

    id_responsable BIGINT NOT NULL
        REFERENCES seguridad.usuario(id_usuario),

    fecha_hora_expulsion TIMESTAMPTZ NOT NULL,

    fecha_hora_registro TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    motivo VARCHAR(200) NOT NULL,

    observaciones TEXT,

    CONSTRAINT uq_expulsion_examen_estudiante
        UNIQUE (id_examen, id_estudiante),

    CONSTRAINT ck_expulsion_motivo_no_vacio
        CHECK (LENGTH(BTRIM(motivo)) > 0)
);

CREATE INDEX idx_expulsion_estudiante
    ON academico.expulsion (id_estudiante);
