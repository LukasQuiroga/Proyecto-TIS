ALTER TABLE academico.habilitacion_estudiante
ADD COLUMN titulo_motivo_personalizado VARCHAR(120),
ADD COLUMN motivo_personalizado VARCHAR(500);

ALTER TABLE academico.habilitacion_estudiante
ADD CONSTRAINT chk_habilitacion_motivo_personalizado
CHECK (
    (
        titulo_motivo_personalizado IS NULL
        AND motivo_personalizado IS NULL
    )
    OR
    (
        estado = 'INHABILITADO'
        AND id_motivo IS NOT NULL
        AND titulo_motivo_personalizado IS NOT NULL
        AND motivo_personalizado IS NOT NULL
        AND LENGTH(TRIM(titulo_motivo_personalizado)) > 0
        AND LENGTH(TRIM(motivo_personalizado)) > 0
    )
);