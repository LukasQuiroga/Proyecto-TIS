-- 1. Catalogo de motivos de inhabilitacion.
CREATE TABLE academico.motivo_inhabilitacion (
    id_motivo BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    descripcion VARCHAR(500),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_motivo_nombre
        CHECK (LENGTH(TRIM(nombre)) > 0)
);

CREATE UNIQUE INDEX uq_motivo_inhabilitacion_nombre
    ON academico.motivo_inhabilitacion (LOWER(TRIM(nombre)));

-- 2. Estado vigente de cada estudiante para cada examen.
CREATE TABLE academico.habilitacion_estudiante (
    id_examen BIGINT NOT NULL,
    id_estudiante BIGINT NOT NULL,
    estado VARCHAR(20) NOT NULL,
    id_motivo BIGINT,
    motivo_personalizado VARCHAR(500),
    observaciones VARCHAR(1000),
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario_responsable BIGINT,
    version BIGINT NOT NULL DEFAULT 0,

    PRIMARY KEY (id_examen, id_estudiante),

    CONSTRAINT fk_habilitacion_examen_estudiante
        FOREIGN KEY (id_examen, id_estudiante)
        REFERENCES academico.examen_estudiante
            (id_examen, id_estudiante),

    CONSTRAINT fk_habilitacion_motivo
        FOREIGN KEY (id_motivo)
        REFERENCES academico.motivo_inhabilitacion (id_motivo),

    CONSTRAINT fk_habilitacion_responsable
        FOREIGN KEY (id_usuario_responsable)
        REFERENCES seguridad.usuario (id_usuario),

    CONSTRAINT chk_habilitacion_estado
        CHECK (estado IN ('HABILITADO', 'INHABILITADO')),

    CONSTRAINT chk_habilitacion_version
        CHECK (version >= 0),

    CONSTRAINT chk_habilitacion_motivo_personalizado
        CHECK (
            motivo_personalizado IS NULL
            OR LENGTH(TRIM(motivo_personalizado)) > 0
        ),

    CONSTRAINT chk_habilitacion_motivo_exclusivo
        CHECK (
            id_motivo IS NULL
            OR motivo_personalizado IS NULL
        ),

    CONSTRAINT chk_habilitacion_motivo_estado
        CHECK (
            estado = 'INHABILITADO'
            OR (
                id_motivo IS NULL
                AND motivo_personalizado IS NULL
            )
        )
);

CREATE INDEX idx_habilitacion_estudiante
    ON academico.habilitacion_estudiante (id_estudiante);

CREATE INDEX idx_habilitacion_examen_estado
    ON academico.habilitacion_estudiante (id_examen, estado);

CREATE INDEX idx_habilitacion_motivo
    ON academico.habilitacion_estudiante (id_motivo);

-- 3. Historial de habilitaciones y motivos.
CREATE TABLE academico.historial_habilitacion (
    id_historial BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_examen BIGINT NOT NULL,
    id_estudiante BIGINT NOT NULL,
    estado_anterior VARCHAR(20),
    estado_nuevo VARCHAR(20) NOT NULL,
    motivo_anterior TEXT,
    motivo_nuevo TEXT,
    observaciones_anteriores TEXT,
    observaciones_nuevas TEXT,
    id_usuario_responsable BIGINT,
    fecha_cambio TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo_operacion VARCHAR(20) NOT NULL,

    CONSTRAINT fk_historial_habilitacion
        FOREIGN KEY (id_examen, id_estudiante)
        REFERENCES academico.habilitacion_estudiante
            (id_examen, id_estudiante),

    CONSTRAINT fk_historial_responsable
        FOREIGN KEY (id_usuario_responsable)
        REFERENCES seguridad.usuario (id_usuario),

    CONSTRAINT chk_historial_estado_anterior
        CHECK (
            estado_anterior IS NULL
            OR estado_anterior IN ('HABILITADO', 'INHABILITADO')
        ),

    CONSTRAINT chk_historial_estado_nuevo
        CHECK (
            estado_nuevo IN ('HABILITADO', 'INHABILITADO')
        ),

    CONSTRAINT chk_historial_operacion
        CHECK (
            tipo_operacion IN (
                'REGISTRO',
                'MODIFICACION',
                'REHABILITACION'
            )
        )
);

CREATE INDEX idx_historial_habilitacion
    ON academico.historial_habilitacion
        (id_examen, id_estudiante, fecha_cambio DESC);

CREATE INDEX idx_historial_fecha
    ON academico.historial_habilitacion (fecha_cambio DESC);
