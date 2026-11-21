CREATE TABLE seguridad.reporte_snapshot (
    id_reporte BIGINT PRIMARY KEY,

    contenido JSONB NOT NULL,

    fecha_snapshot TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reporte_snapshot_log
        FOREIGN KEY (id_reporte)
        REFERENCES seguridad.log_actividad(id_log)
        ON DELETE CASCADE,

    CONSTRAINT ck_reporte_snapshot_contenido
        CHECK (jsonb_typeof(contenido) = 'object')
);
