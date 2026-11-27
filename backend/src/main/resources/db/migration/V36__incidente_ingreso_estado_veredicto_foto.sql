ALTER TABLE academico.intento_ingreso_no_autorizado
    ADD COLUMN IF NOT EXISTS estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    ADD COLUMN IF NOT EXISTS veredicto VARCHAR(300),
    ADD COLUMN IF NOT EXISTS fecha_hora_resolucion TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS id_docente_resolucion BIGINT REFERENCES seguridad.usuario(id_usuario),
    ADD COLUMN IF NOT EXISTS foto_recurso VARCHAR(255);
