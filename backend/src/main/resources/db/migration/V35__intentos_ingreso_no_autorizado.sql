CREATE TABLE academico.intento_ingreso_no_autorizado (
    id_intento BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_examen BIGINT NOT NULL REFERENCES academico.examen(id_examen),
    id_estudiante BIGINT REFERENCES seguridad.usuario(id_usuario),
    id_responsable BIGINT NOT NULL REFERENCES seguridad.usuario(id_usuario),
    identificador_intentado VARCHAR(100),
    metodo_identificacion VARCHAR(20) NOT NULL,
    motivo_rechazo VARCHAR(255) NOT NULL,
    fecha_hora TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_intento_metodo CHECK (metodo_identificacion IN ('CODIGO', 'DOCUMENTO', 'SISTEMA'))
);
CREATE INDEX idx_intento_ingreso_examen_fecha
    ON academico.intento_ingreso_no_autorizado (id_examen, fecha_hora DESC);
