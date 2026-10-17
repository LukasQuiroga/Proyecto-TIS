ALTER TABLE academico.habilitacion_estudiante
ADD COLUMN observaciones VARCHAR(500);

CREATE TABLE academico.historial_habilitacion (
    id_historial BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_examen BIGINT NOT NULL,
    id_estudiante BIGINT NOT NULL,
    estado_anterior VARCHAR(20),
    estado_nuevo VARCHAR(20) NOT NULL,
    titulo_motivo_anterior VARCHAR(120),
    motivo_anterior VARCHAR(500),
    titulo_motivo_nuevo VARCHAR(120),
    motivo_nuevo VARCHAR(500),
    observaciones_anteriores VARCHAR(500),
    observaciones_nuevas VARCHAR(500),
    id_usuario_responsable BIGINT NOT NULL,
    fecha_cambio TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_historial_habilitacion
        FOREIGN KEY (id_examen, id_estudiante)
        REFERENCES academico.habilitacion_estudiante (id_examen, id_estudiante),

    CONSTRAINT fk_historial_responsable
        FOREIGN KEY (id_usuario_responsable)
        REFERENCES seguridad.usuario (id_usuario),

    CONSTRAINT chk_historial_estado_nuevo
        CHECK (estado_nuevo IN ('HABILITADO', 'INHABILITADO')),

    CONSTRAINT chk_historial_estado_anterior
        CHECK (
            estado_anterior IS NULL
            OR estado_anterior IN ('HABILITADO', 'INHABILITADO')
        )
);

CREATE INDEX idx_historial_habilitacion_estudiante_examen
ON academico.historial_habilitacion (
    id_examen,
    id_estudiante,
    fecha_cambio DESC
);