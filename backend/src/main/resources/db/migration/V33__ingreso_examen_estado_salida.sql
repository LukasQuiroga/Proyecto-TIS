
ALTER TABLE academico.ingreso_examen
    ADD COLUMN IF NOT EXISTS estado VARCHAR(20) NOT NULL DEFAULT 'REGISTRADO',
    ADD COLUMN IF NOT EXISTS motivo_suspension TEXT,
    ADD COLUMN IF NOT EXISTS motivo_reincorporacion TEXT,
    ADD COLUMN IF NOT EXISTS fecha_hora_salida TIMESTAMPTZ;

UPDATE academico.ingreso_examen
SET estado = 'REGISTRADO'
WHERE estado IS NULL;
