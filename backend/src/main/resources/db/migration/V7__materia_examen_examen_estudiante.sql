CREATE TABLE materia (
    id_materia     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_docente     BIGINT       NOT NULL REFERENCES usuario (id_usuario),
    nombre_materia VARCHAR(120) NOT NULL,
    grupo          VARCHAR(20)  NOT NULL
);

CREATE UNIQUE INDEX idx_materia_nombre_grupo ON materia (nombre_materia, grupo);
CREATE INDEX idx_materia_docente ON materia (id_docente);

CREATE TABLE examen (
    id_examen     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_materia    BIGINT       NOT NULL REFERENCES materia (id_materia),
    nombre_examen VARCHAR(120) NOT NULL,
    fecha_examen  DATE         NOT NULL,
    hora_inicio   TIME         NOT NULL,
    hora_fin      TIME         NOT NULL,
    CONSTRAINT examen_hora_fin_mayor CHECK (hora_fin > hora_inicio)
);

CREATE INDEX idx_examen_materia ON examen (id_materia);
CREATE INDEX idx_examen_fecha ON examen (fecha_examen);

CREATE TABLE examen_estudiante (
    id_examen     BIGINT NOT NULL REFERENCES examen (id_examen),
    id_estudiante BIGINT NOT NULL REFERENCES usuario (id_usuario),
    PRIMARY KEY (id_examen, id_estudiante)
);

CREATE INDEX idx_examen_estudiante ON examen_estudiante (id_estudiante);