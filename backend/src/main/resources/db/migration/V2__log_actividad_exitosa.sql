ALTER TABLE log_actividad
    ADD COLUMN exitosa BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX idx_log_exitosa ON log_actividad (exitosa);