ALTER TABLE seguridad.usuario
    ADD COLUMN IF NOT EXISTS fecha_primer_inicio_sesion TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_usuario_plazo_foto
    ON seguridad.usuario (fecha_primer_inicio_sesion)
    WHERE activo = TRUE AND (foto_perfil IS NULL OR BTRIM(foto_perfil) = '');
