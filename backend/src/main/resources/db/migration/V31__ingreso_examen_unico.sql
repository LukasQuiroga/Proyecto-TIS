
CREATE TABLE academico.ingreso_examen (
    id_ingreso BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    id_examen BIGINT NOT NULL
        REFERENCES academico.examen(id_examen),

    id_estudiante BIGINT NOT NULL
        REFERENCES seguridad.usuario(id_usuario),

    fecha_hora_ingreso TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    id_responsable BIGINT NOT NULL
        REFERENCES seguridad.usuario(id_usuario),

    CONSTRAINT uq_ingreso_examen_estudiante
        UNIQUE (id_examen, id_estudiante)
);

CREATE INDEX idx_ingreso_examen_estudiante
    ON academico.ingreso_examen (id_estudiante);
