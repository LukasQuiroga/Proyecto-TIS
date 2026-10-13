
CREATE TABLE academico.motivo_inhabilitacion (
    id_motivo BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    titulo VARCHAR(120) NOT NULL,
    motivo VARCHAR(500) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_motivo_titulo CHECK (LENGTH(TRIM(titulo)) > 0),
    CONSTRAINT chk_motivo_texto CHECK (LENGTH(TRIM(motivo)) > 0)
);

CREATE UNIQUE INDEX uq_motivo_titulo
ON academico.motivo_inhabilitacion (LOWER(TRIM(titulo)));

CREATE TABLE academico.habilitacion_estudiante (
    id_examen BIGINT NOT NULL,
    id_estudiante BIGINT NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'HABILITADO',
    id_motivo BIGINT,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario_responsable BIGINT,
    numero_cambios BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id_examen, id_estudiante),
    CONSTRAINT fk_habilitacion_examen_estudiante
        FOREIGN KEY (id_examen, id_estudiante)
        REFERENCES academico.examen_estudiante (id_examen, id_estudiante),
    CONSTRAINT fk_habilitacion_motivo
        FOREIGN KEY (id_motivo)
        REFERENCES academico.motivo_inhabilitacion (id_motivo),
    CONSTRAINT fk_habilitacion_responsable
        FOREIGN KEY (id_usuario_responsable)
        REFERENCES seguridad.usuario (id_usuario),
    CONSTRAINT chk_habilitacion_estado
        CHECK (estado IN ('HABILITADO', 'INHABILITADO')),
    CONSTRAINT chk_habilitacion_motivo_estado
        CHECK (
            (estado = 'HABILITADO' AND id_motivo IS NULL)
            OR
            (estado = 'INHABILITADO' AND id_motivo IS NOT NULL)
        ),
    CONSTRAINT chk_habilitacion_numero_cambios
        CHECK (numero_cambios >= 0)
);

CREATE INDEX idx_habilitacion_estudiante
ON academico.habilitacion_estudiante (id_estudiante);

CREATE INDEX idx_habilitacion_examen_estado
ON academico.habilitacion_estudiante (id_examen, estado);
