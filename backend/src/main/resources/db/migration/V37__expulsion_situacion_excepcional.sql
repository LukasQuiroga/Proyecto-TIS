CREATE TABLE academico.expulsion (
    id_expulsion BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_examen BIGINT NOT NULL
        REFERENCES academico.examen(id_examen),
    id_estudiante BIGINT NOT NULL
        REFERENCES seguridad.usuario(id_usuario),
    id_responsable BIGINT NOT NULL
        REFERENCES seguridad.usuario(id_usuario),
    fecha_hora_expulsion TIMESTAMPTZ NOT NULL,
    fecha_hora_registro TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    motivo VARCHAR(200) NOT NULL,
    observaciones TEXT,
    CONSTRAINT uq_expulsion_examen_estudiante
        UNIQUE (id_examen, id_estudiante),
    CONSTRAINT ck_expulsion_motivo_no_vacio
        CHECK (LENGTH(BTRIM(motivo)) > 0)
);

CREATE INDEX idx_expulsion_estudiante
    ON academico.expulsion (id_estudiante);

CREATE TABLE academico.situacion_excepcional (
    id_situacion BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_examen BIGINT NOT NULL,
    id_estudiante BIGINT,
    id_registrado_por BIGINT NOT NULL,
    tipo_situacion VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_ocurrencia DATE NOT NULL,
    hora_ocurrencia TIME NOT NULL,
    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    evidencia_referencia VARCHAR(1000),
    CONSTRAINT fk_situacion_examen
        FOREIGN KEY (id_examen)
        REFERENCES academico.examen (id_examen),
    CONSTRAINT fk_situacion_estudiante
        FOREIGN KEY (id_estudiante)
        REFERENCES seguridad.usuario (id_usuario),
    CONSTRAINT fk_situacion_registrador
        FOREIGN KEY (id_registrado_por)
        REFERENCES seguridad.usuario (id_usuario),
    CONSTRAINT ck_situacion_tipo_no_vacio
        CHECK (LENGTH(BTRIM(tipo_situacion)) > 0),
    CONSTRAINT ck_situacion_descripcion_no_vacia
        CHECK (LENGTH(BTRIM(descripcion)) > 0)
);

CREATE INDEX idx_situacion_examen_fecha
    ON academico.situacion_excepcional (id_examen, fecha_registro DESC);

CREATE INDEX idx_situacion_estudiante
    ON academico.situacion_excepcional (id_estudiante);
