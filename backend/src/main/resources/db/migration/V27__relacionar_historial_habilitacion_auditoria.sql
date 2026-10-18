ALTER TABLE academico.historial_habilitacion
ADD COLUMN id_log_actividad BIGINT;

ALTER TABLE academico.historial_habilitacion
ADD CONSTRAINT fk_historial_habilitacion_log
FOREIGN KEY (id_log_actividad)
REFERENCES seguridad.log_actividad(id_log);

CREATE UNIQUE INDEX uq_historial_habilitacion_log
ON academico.historial_habilitacion(id_log_actividad)
WHERE id_log_actividad IS NOT NULL;